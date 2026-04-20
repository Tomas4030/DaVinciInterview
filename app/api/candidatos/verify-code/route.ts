import { NextRequest, NextResponse } from "next/server";
import { verificarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { criarSessao } from "@/lib/queries/candidatos";
import { withTimeout } from "@/lib/timeout";
import {
  createLocalSession,
  verifyLocalVerificationCode,
} from "@/lib/in-memory-verification";
import {
  formatPhoneNumberE164,
  isSupportedPhoneCountry,
  validatePhoneNumberForCountry,
} from "@/lib/validation";

// TTL para a sessão de entrevista (em minutos)
const INTERVIEW_SESSION_TTL_MINUTES = 15;
const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const { email, vaga_id, code, telefone, telefone_pais } = await request.json();

    if (!email || !vaga_id || !code) {
      return NextResponse.json(
        { error: "Email, vaga_id e código são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();
    const normalizedCountry = String(telefone_pais || "PT").trim().toUpperCase();

    if (!isSupportedPhoneCountry(normalizedCountry)) {
      return NextResponse.json(
        { error: "País de telemóvel inválido" },
        { status: 400 },
      );
    }

    const normalizedPhoneInput = String(telefone || "").trim();
    let normalizedPhone = "";

    if (normalizedPhoneInput) {
      const phoneValidation = validatePhoneNumberForCountry(
        normalizedPhoneInput,
        normalizedCountry,
      );

      if (!phoneValidation.isValid) {
        const errorMessage =
          phoneValidation.reason === "format"
            ? "Formato de telemóvel incorreto para o país selecionado"
            : "Número de telemóvel inválido";

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      normalizedPhone =
        formatPhoneNumberE164(normalizedPhoneInput, normalizedCountry) ||
        phoneValidation.e164;
    }

    // Verificar código
    let isValid = false;
    try {
      isValid = await withTimeout(
        verificarCodigoVerificacao(normalizedEmail, normalizedCode),
        DB_OP_TIMEOUT_MS,
        "verify-code:verificarCodigoVerificacao",
      );
    } catch (error) {
      isValid = verifyLocalVerificationCode(normalizedEmail, normalizedCode);
      console.warn("[verify-code] DB indisponível, a validar código em memória.", error);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    // Gerar sessão de entrevista com TTL
    let sessionToken = "";
    let expiresAt = new Date(
      Date.now() + INTERVIEW_SESSION_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    try {
      sessionToken = await withTimeout(
        criarSessao(normalizedEmail, normalizedPhone, vaga_id),
        DB_OP_TIMEOUT_MS,
        "verify-code:criarSessao",
      );
    } catch (error) {
      const localSession = createLocalSession(
        normalizedEmail,
        normalizedPhone,
        vaga_id,
        INTERVIEW_SESSION_TTL_MINUTES,
      );
      sessionToken = localSession.sessionToken;
      expiresAt = localSession.expiresAt;
      console.warn("[verify-code] DB indisponível, sessão criada em memória.", error);
    }

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso",
      sessionToken,
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
