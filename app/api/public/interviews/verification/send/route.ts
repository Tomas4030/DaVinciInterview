import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import { verificarDuplicata } from "@/lib/queries/candidatos";
import {
  criarCodigoVerificacaoEntrevista,
  gerarCodigoVerificacaoEntrevista,
} from "@/lib/queries/interview-verification";
import { sendVerificationCodeEmail } from "@/lib/email";
import { withTimeout } from "@/lib/timeout";
import { saveLocalVerificationCode } from "@/lib/in-memory-verification";
import {
  formatPhoneNumberE164,
  isSupportedPhoneCountry,
  validatePhoneNumberForCountry,
} from "@/lib/validation";

const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      request.nextUrl.hostname,
    );
    const allowInsecureCodeFallback =
      process.env.ALLOW_INSECURE_CODE_FALLBACK === "true";

    const body = await request.json();
    const slug = String(body?.slug || "").trim();
    const interviewId = String(body?.interviewId || "").trim();
    const candidateName = String(body?.candidateName || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const telefone = String(body?.telefone || "").trim();
    const telefonePais = String(body?.telefone_pais || "PT")
      .trim()
      .toUpperCase();

    if (!slug || !interviewId || !candidateName || !email || !telefone) {
      return NextResponse.json(
        { error: "Dados obrigatórios em falta" },
        { status: 400 },
      );
    }

    if (!isSupportedPhoneCountry(telefonePais)) {
      return NextResponse.json(
        { error: "País de telemóvel inválido" },
        { status: 400 },
      );
    }

    const phoneValidation = validatePhoneNumberForCountry(telefone, telefonePais);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          error:
            phoneValidation.reason === "format"
              ? "Formato de telemóvel incorreto para o país selecionado"
              : "Número de telemóvel inválido",
        },
        { status: 400 },
      );
    }

    const normalizedPhone =
      formatPhoneNumberE164(telefone, telefonePais) || phoneValidation.e164;

    const company = await getCompanyBySlug(slug);
    if (!company || company.subscription_status === "canceled") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const interview = await getInterviewById(interviewId, company.id);
    if (!interview || interview.status !== "published") {
      return NextResponse.json(
        { error: "Entrevista não encontrada" },
        { status: 404 },
      );
    }

    const temDuplicata = await withTimeout(
      verificarDuplicata(email, normalizedPhone, company.id, interview.id),
      DB_OP_TIMEOUT_MS,
      "public-send-code:verificarDuplicata",
    );

    if (temDuplicata) {
      return NextResponse.json(
        { error: "Já existe uma candidatura para esta entrevista com estes dados" },
        { status: 409 },
      );
    }

    let codigo = "";
    try {
      codigo = await withTimeout(
        criarCodigoVerificacaoEntrevista({
          email,
          telefone: normalizedPhone,
          telefonePais,
          companyId: company.id,
          interviewId: interview.id,
          candidateName,
        }),
        DB_OP_TIMEOUT_MS,
        "public-send-code:criarCodigoVerificacaoEntrevista",
      );
    } catch (error) {
      codigo = gerarCodigoVerificacaoEntrevista();
      saveLocalVerificationCode(
        `${email}|${company.id}|${interview.id}`,
        codigo,
        15,
      );
      console.warn(
        "[public-send-code] DB indisponível, código guardado em memória temporária.",
        error,
      );
    }

    try {
      await sendVerificationCodeEmail(email, codigo);
    } catch (error) {
      console.error("[public-send-code] Falha no envio SMTP:", error);

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
    console.error("[POST /api/public/interviews/verification/send]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
