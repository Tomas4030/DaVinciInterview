import { NextRequest, NextResponse } from "next/server";
import { verificarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { criarSessao } from "@/lib/queries/candidatos";

// TTL para a sessão de entrevista (em minutos)
const INTERVIEW_SESSION_TTL_MINUTES = 15;

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
    const isValid = await verificarCodigoVerificacao(
      normalizedEmail,
      normalizedCode,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    // Gerar sessão de entrevista com TTL
    const sessionToken = await criarSessao(
      normalizedEmail,
      telefone || "",
      vaga_id,
    );

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso",
      sessionToken,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
