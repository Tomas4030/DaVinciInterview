import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { createAuthEmailChallenge } from "@/lib/auth-email-verification";
import { sendVerificationCodeEmail } from "@/lib/email";
import {
  getUserByEmail,
  verifyUserCredentials,
} from "@/lib/queries/users";

export async function POST(request: NextRequest) {
  try {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      request.nextUrl.hostname,
    );
    const allowInsecureCodeFallback =
      process.env.ALLOW_INSECURE_CODE_FALLBACK === "true";

    const body = await request.json();
    const action = String(body?.action || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim() || null;
    const rawNext = String(body?.next || "").trim();
    const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

    if ((action !== "signup" && action !== "login") || !email) {
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }

    if (action === "signup") {
      if (!password) {
        return NextResponse.json(
          { error: "Email e password são obrigatórios" },
          { status: 400 },
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: "A password deve ter pelo menos 8 caracteres" },
          { status: 400 },
        );
      }

      const existing = await getUserByEmail(email);
      if (existing?.password_hash) {
        return NextResponse.json(
          { error: "Já existe conta com este email" },
          { status: 409 },
        );
      }
    }

    if (action === "login") {
      if (!password) {
        return NextResponse.json(
          { error: "Email e password são obrigatórios" },
          { status: 400 },
        );
      }

      const user = await verifyUserCredentials(email, password);
      const isLegacyAdmin = verifyAdminCredentials(email, password);
      if (!user && !isLegacyAdmin) {
        return NextResponse.json(
          { error: "Email ou senha inválidos" },
          { status: 401 },
        );
      }
    }

    const { challengeId, code } = createAuthEmailChallenge({
      action,
      email,
      password,
      name,
      next: safeNext,
    });

    try {
      const emailResult = await sendVerificationCodeEmail(email, code);
      if (emailResult.usedFallbackTransport) {
        return NextResponse.json({
          success: true,
          challengeId,
          devCode: code,
        });
      }
    } catch (error) {
      console.error("[auth-email-send] Falha no envio SMTP:", error);

      if (isLocalHost || process.env.NODE_ENV !== "production") {
        return NextResponse.json({ success: true, challengeId, devCode: code });
      }

      if (allowInsecureCodeFallback) {
        return NextResponse.json({ success: true, challengeId, devCode: code });
      }

      return NextResponse.json(
        {
          error:
            "Serviço de email indisponível. Confirma a configuração SMTP no servidor.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      challengeId,
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error("[POST /api/auth/email-verification/send]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
