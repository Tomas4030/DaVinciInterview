// app/api/candidatos/verify-session/route.ts
// POST /api/candidatos/verify-session
// Valida se uma sessão de entrevista ainda é válida

import { NextRequest, NextResponse } from "next/server";
import { validarSessao } from "@/lib/queries/candidatos";

export async function POST(request: NextRequest) {
  try {
    const { sessionToken, vagaId } = await request.json();

    if (!sessionToken || !vagaId) {
      return NextResponse.json(
        { error: "sessionToken e vagaId são obrigatórios" },
        { status: 400 },
      );
    }

    // Validar sessão
    const sessao = await validarSessao(sessionToken);

    if (!sessao) {
      return NextResponse.json(
        { error: "Sessão não encontrada ou expirada" },
        { status: 404 },
      );
    }

    // Verificar se vaga_id coincide
    if (sessao.vaga_id !== vagaId) {
      return NextResponse.json(
        { error: "Sessão inválida para esta vaga" },
        { status: 401 },
      );
    }

    // Sessão válida — retornar dados do candidato
    return NextResponse.json({
      success: true,
      email: sessao.email,
      telefone: sessao.telefone,
      vagaId: sessao.vaga_id,
      expiresAt: sessao.expires_at,
    });
  } catch (error) {
    console.error("[POST /api/candidatos/verify-session]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
