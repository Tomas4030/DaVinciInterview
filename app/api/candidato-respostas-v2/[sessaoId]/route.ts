// app/api/candidato-respostas-v2/[sessaoId]/route.ts
/**
 * POST /api/candidato-respostas-v2/[sessaoId] - Guardar resposta individual
 * GET /api/candidato-respostas-v2/[sessaoId] - Obter respostas da sessão
 */

import { NextRequest, NextResponse } from "next/server";
import {
  guardarRespostaPersistencia,
  obterRespostasGuardadas,
  RespostaPersistencia,
} from "@/lib/persistence-helper";

export interface GuardarRespostaRequest {
  pergunta_id: number;
  resposta_final: string;
  iteration_count: number;
  follow_ups: Array<{
    id: string;
    tipo: "usuario_resposta" | "ia_follow_up";
    conteudo: string;
    timestamp: string;
  }>;
  vaga_id: string;
}

/**
 * POST - Guardar uma resposta individual
 * Apenas guarda se estado for "completed"
 * Implementa idempotência automática
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessaoId: string } },
) {
  try {
    const sessaoId = params.sessaoId;
    const body: GuardarRespostaRequest = await request.json();

    const {
      pergunta_id,
      resposta_final,
      iteration_count,
      follow_ups,
      vaga_id,
    } = body;

    // Validar campos obrigatórios
    if (!pergunta_id || !resposta_final || !vaga_id) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "pergunta_id, resposta_final e vaga_id são obrigatórios",
        },
        { status: 400 },
      );
    }

    // Construir objeto resposta com estado "completed"
    const resposta: RespostaPersistencia = {
      sessao_id: sessaoId,
      vaga_id,
      pergunta_id,
      resposta_final,
      iteration_count: iteration_count || 1,
      follow_ups: follow_ups || [],
      estado: "completed", // Sempre "completed" quando é enviado para persistir
    };

    // Guardar com persistência segura
    const resultado = await guardarRespostaPersistencia(resposta);

    if (!resultado.sucesso) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.erro,
          mensagem: resultado.mensagem,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: resultado.mensagem,
        dados: resultado.dados,
      },
      { status: 200 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/candidato-respostas-v2/[sessaoId]]", err);

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status: 500 },
    );
  }
}

/**
 * GET - Obter todas as respostas guardadas de uma sessão
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessaoId: string } },
) {
  try {
    const sessaoId = params.sessaoId;

    if (!sessaoId) {
      return NextResponse.json(
        { sucesso: false, erro: "sessaoId é obrigatório" },
        { status: 400 },
      );
    }

    const resultado = await obterRespostasGuardadas(sessaoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.erro,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        total: resultado.dados?.length || 0,
        respostas: resultado.dados || [],
      },
      { status: 200 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[GET /api/candidato-respostas-v2/[sessaoId]]", err);

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status: 500 },
    );
  }
}
