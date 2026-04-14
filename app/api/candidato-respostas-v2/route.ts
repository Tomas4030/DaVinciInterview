// app/api/candidato-respostas-v2/route.ts
/**
 * Endpoints v2 para gerência de respostas com state machine
 *
 * POST /api/candidato-respostas-v2 - Criar sessão de respostas
 * GET /api/candidato-respostas-v2?sessionId=... - Obter respostas
 */

import { NextRequest, NextResponse } from "next/server";
import {
  criarSessaoEntrevista,
  atualizarCandidatoSessao,
  buscarSessao,
} from "@/lib/queries/sessoes";
import { buscarRespostasV2 } from "@/lib/queries/analises";

export interface CriarSessaoRespostasRequest {
  sessao_id?: string;
  vaga_id: string;
  email_candidato?: string;
  telefone_candidato?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CriarSessaoRespostasRequest = await request.json();
    const { vaga_id, email_candidato, telefone_candidato } = body;

    if (!vaga_id) {
      return NextResponse.json(
        { error: "vaga_id é obrigatório" },
        { status: 400 },
      );
    }

    // Criar nova sessão
    const sessao_id = await criarSessaoEntrevista(vaga_id);

    // Atualizar com dados do candidato se fornecidos
    if (email_candidato && telefone_candidato) {
      await atualizarCandidatoSessao(
        sessao_id,
        email_candidato,
        telefone_candidato,
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Sessão criada com sucesso",
        sessao_id: sessao_id,
      },
      { status: 201 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/candidato-respostas-v2]", err);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId é obrigatório" },
        { status: 400 },
      );
    }

    // Obter todas as respostas desta sessão que foram guardadas
    const respostas = await buscarRespostasV2(sessionId);

    // Filtrar apenas estado "saved"
    const respostasSaved = respostas.filter((r) => r.estado === "saved");

    return NextResponse.json({
      sucesso: true,
      total: respostasSaved.length,
      respostas: respostasSaved,
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[GET /api/candidato-respostas-v2]", err);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
