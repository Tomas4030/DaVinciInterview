// app/api/analise/gerar-resumo/route.ts
/**
 * POST /api/analise/gerar-resumo
 *
 * Gera análise automática das respostas de um candidato
 * Retorna: pontos fortes, fracos, scores, recomendação
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analisarSessao, RespostaAnalisada } from "@/lib/analysis-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
    const { data: respostas, error: fetchError } = await supabase
      .from("candidato_respostas_v2")
      .select(
        "pergunta_id, resposta_final, qualidade_estimada, follow_ups, iteration_count",
      )
      .eq("sessao_id", sessao_id)
      .eq("vaga_id", vaga_id)
      .eq("estado", "saved")
      .order("pergunta_id", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Erro ao obter respostas: ${fetchError.message}`,
        },
        { status: 500 },
      );
    }

    if (!respostas || respostas.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Nenhuma resposta encontrada para esta sessão",
        },
        { status: 404 },
      );
    }

    // Obter informações da vaga para contexto
    const { data: vagaData } = await supabase
      .from("vagas")
      .select("perguntas")
      .eq("id", vaga_id)
      .single();

    const perguntasMap = new Map(
      (vagaData?.perguntas || []).map((p: any) => [p.id, p.texto]),
    );

    // Preparar respostas para análise
    const respostasParaAnalise: RespostaAnalisada[] = respostas.map((r) => ({
      pergunta_id: r.pergunta_id,
      texto_pergunta:
        (perguntasMap.get(r.pergunta_id) as string | undefined) ||
        `Pergunta #${r.pergunta_id}`,
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
      await supabase.from("analises_entrevista").insert({
        sessao_id,
        vaga_id,
        email_candidato: emailCandidato,
        analisis_json: resultado.dados,
        score_geral: resultado.dados?.scores.media || 0,
        recomendacao: resultado.dados?.recomendacao_geral || "talvez",
        criada_em: new Date().toISOString(),
      });
    } catch {
      // Se a tabela não existe, só continua sem guardar
      console.warn("Tabela de análises não existe, continuando sem guardar");
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
