import { NextRequest, NextResponse } from "next/server";
import { criarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { gerarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { verificarDuplicata } from "@/lib/queries/candidatos";
import { saveLocalVerificationCode } from "@/lib/in-memory-verification";
import { sendVerificationCodeEmail } from "@/lib/email";
import { withTimeout } from "@/lib/timeout";

const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      request.nextUrl.hostname,
    );
    const allowInsecureCodeFallback =
      process.env.ALLOW_INSECURE_CODE_FALLBACK === "true";

    const { email, telefone, vaga_id } = await request.json();

    if (!email || !telefone || !vaga_id) {
      return NextResponse.json(
        { error: "Email, telefone e vaga_id são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(telefone).trim();

    let temDuplicata = false;

    try {
      temDuplicata = await withTimeout(
        verificarDuplicata(normalizedEmail, normalizedPhone, vaga_id),
        DB_OP_TIMEOUT_MS,
        "send-code:verificarDuplicata",
      );
    } catch (error) {
      console.warn("[send-code] DB indisponível ao verificar duplicata, a continuar sem bloqueio.", error);
    }

    if (temDuplicata) {
      return NextResponse.json(
        { error: "Já existe uma candidatura para esta vaga com estes dados" },
        { status: 409 },
      );
    }

    let codigo = "";
    try {
      codigo = await withTimeout(
        criarCodigoVerificacao(normalizedEmail),
        DB_OP_TIMEOUT_MS,
        "send-code:criarCodigoVerificacao",
      );
    } catch (error) {
      codigo = gerarCodigoVerificacao();
      saveLocalVerificationCode(normalizedEmail, codigo, 15);
      console.warn("[send-code] DB indisponível, código guardado em memória temporária.", error);
    }

    try {
      await sendVerificationCodeEmail(normalizedEmail, codigo);
    } catch (error) {
      console.error("[send-code] Falha no envio SMTP:", error);

      if (isLocalHost || process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          success: true,
          message: "SMTP indisponível em ambiente local",
          devCode: codigo,
        });
      }

      if (allowInsecureCodeFallback) {
        return NextResponse.json({
          success: true,
          message:
            "SMTP indisponível. Fallback de emergência ativo para validação manual.",
          devCode: codigo,
        });
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
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao enviar código:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}