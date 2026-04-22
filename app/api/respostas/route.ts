// app/api/respostas/route.ts
// POST /api/respostas → adicionar resposta a candidatura
// Endpoint para adicionar respostas individuais

import { NextRequest, NextResponse } from "next/server";
import {
  buscarCandidaturaPorSessao,
  atualizarRespostas,
} from "@/lib/queries/candidato-respostas";
import { resolveCompanyAndInterviewFromLegacyVaga } from "@/lib/queries/interviews";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessao_id,
      vaga_id,
      pergunta_id,
      resposta_texto,
      texto_pergunta,
      duracao_segundos,
    } = body;

    if (!sessao_id || !vaga_id || !pergunta_id || !resposta_texto) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: sessao_id, vaga_id, pergunta_id, resposta_texto",
        },
        { status: 400 },
      );
    }

    const scope = await resolveCompanyAndInterviewFromLegacyVaga(vaga_id);
    if (!scope) {
      return NextResponse.json(
        { error: "Entrevista inválida para este identificador de vaga" },
        { status: 400 },
      );
    }

    // Obter candidatura existente pela sessao_id
    const candidatura = await buscarCandidaturaPorSessao(
      sessao_id,
      scope.companyId,
    );

    if (!candidatura) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 },
      );
    }

    // Adicionar resposta ao array
    const respostasAtuais = candidatura.respostas || [];
    const novaResposta = {
      pergunta_id,
      texto_pergunta,
      resposta_texto,
      duracao_segundos: duracao_segundos || 0,
      timestamp: new Date().toISOString(),
    };

    // Atualizar ou adicionar resposta
    const respostasUpdated = respostasAtuais.map((r: any) =>
      r.pergunta_id === pergunta_id ? novaResposta : r,
    );

    if (!respostasUpdated.some((r: any) => r.pergunta_id === pergunta_id)) {
      respostasUpdated.push(novaResposta);
    }

    // Guardar no MySQL
    await atualizarRespostas(sessao_id, scope.companyId, respostasUpdated);

    // Retornar candidatura atualizada
    const candidaturaAtualizada = await buscarCandidaturaPorSessao(
      sessao_id,
      scope.companyId,
    );

    return NextResponse.json(
      { success: true, data: candidaturaAtualizada },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/respostas]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
