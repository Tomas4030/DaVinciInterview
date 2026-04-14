// app/api/analise/gerar-resumo/route.ts
/**
 * POST /api/analise/gerar-resumo
 *
 * Gera análise automática das respostas de um candidato
 * Retorna: pontos fortes, fracos, scores, recomendação
 */

import { NextRequest, NextResponse } from "next/server";
import { analisarSessao, RespostaAnalisada } from "@/lib/analysis-engine";
import { buscarRespostasV2 } from "@/lib/queries/analises";
import { criarAnalise } from "@/lib/queries/analises";

export interface GerarResumoRequest {
  sessao_id: string;
  vaga_id: string;
  vagaTitulo: string;
  emailCandidato?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GerarResumoRequest = await request.json();
    const { sessao_id, vaga_id, vagaTitulo, emailCandidato } = body;

    // Validar
    if (!sessao_id || !vaga_id || !vagaTitulo) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "sessao_id, vaga_id e vagaTitulo são obrigatórios",
        },
        { status: 400 },
      );
    }

    // Obter respostas da sessão
    const respostas = await buscarRespostasV2(sessao_id);

    if (!respostas || respostas.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Nenhuma resposta encontrada para esta sessão",
        },
        { status: 404 },
      );
    }

    // Preparar respostas para análise
    const respostasParaAnalise: RespostaAnalisada[] = respostas.map((r) => ({
      pergunta_id: r.pergunta_id,
      texto_pergunta: `Pergunta #${r.pergunta_id}`, // TODO: trazer de BD
      resposta_texto: r.resposta_final,
      qualidade: r.qualidade_estimada || "aceitavel",
    }));

    // Analisar
    const resultado = await analisarSessao(
      respostasParaAnalise,
      vagaTitulo,
      emailCandidato,
    );

    if (!resultado.sucesso) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.erro,
        },
        { status: 500 },
      );
    }

    // Guardar análise para futuras referências
    try {
      await criarAnalise(
        sessao_id,
        vaga_id,
        emailCandidato || "",
        resultado.dados,
        resultado.dados?.scores?.media || 0,
        resultado.dados?.recomendacao_geral || "talvez",
      );
    } catch (err) {
      console.warn("Erro ao guardar análise, continuando:", err);
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Análise gerada com sucesso",
        dados: resultado.dados,
      },
      { status: 200 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/analise/gerar-resumo]", err);

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status: 500 },
    );
  }
}
