import { NextRequest, NextResponse } from "next/server";
import { verificarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { criarSessao } from "@/lib/queries/candidatos";
import { withTimeout } from "@/lib/timeout";
import {
  createLocalSession,
  verifyLocalVerificationCode,
} from "@/lib/in-memory-verification";

// TTL para a sessão de entrevista (em minutos)
const INTERVIEW_SESSION_TTL_MINUTES = 15;
const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const { email, vaga_id, code, telefone } = await request.json();

    if (!email || !vaga_id || !code) {
      return NextResponse.json(
        { error: "Email, vaga_id e código são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

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
        criarSessao(normalizedEmail, telefone || "", vaga_id),
        DB_OP_TIMEOUT_MS,
        "verify-code:criarSessao",
      );
    } catch (error) {
      const localSession = createLocalSession(
        normalizedEmail,
        telefone || "",
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
