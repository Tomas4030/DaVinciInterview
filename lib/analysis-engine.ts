/**
 * Analysis Engine for Interviews
 *
 * Analyses candidate responses using structured AI to generate:
 * - Strengths and weaknesses
 * - Scores by category
 * - Overall recommendation
 */

import { OpenAI } from "openai";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RespostaAnalisada {
  pergunta_id: number;
  texto_pergunta: string;
  resposta_texto: string;
  qualidade: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente";
}

export interface ScoresPorCategoria {
  comunicacao: number; // 0-100
  conhecimentoTecnico: number;
  profundidade: number;
  clareza: number;
  estruturacao: number;
  media: number;
}

export interface AnalisisResultado {
  candidato?: string;
  data_analise: string;
  total_perguntas: number;
  pontos_fortes: string[];
  pontos_fracos: string[];
  scores: ScoresPorCategoria;
  recomendacao_geral: "rejeitar" | "talvez" | "aceitar" | "excelente";
  justificacao_recomendacao: string;
  resumo_executivo: string;
  sugestoes_melhoria: string[];
}

const SYSTEM_PROMPT_ANALISADOR = `You are a senior interview analyst. Your task is to evaluate a candidate's interview responses objectively and produce a structured assessment.

You ALWAYS write in European Portuguese (pt-PT).

# Evaluation criteria

Score each category from 0 to 100 based on the evidence in the responses:

**Comunicação** — How clearly does the candidate express ideas? Is the language precise? Are complex concepts explained well?

**Conhecimento Técnico** — Does the candidate demonstrate relevant knowledge for the role? Are technical claims accurate and grounded in real experience?

**Profundidade** — Does the candidate go beyond surface-level answers? Are there concrete examples, metrics, or specific scenarios? Does the candidate consider trade-offs and edge cases?

**Clareza** — Are the answers easy to follow? Is there a logical flow? Does the candidate stay on topic?

**Estruturação** — Are the answers well-organised? Does the candidate present ideas in a structured way (problem → approach → result)?

# Scoring guidelines

- 0–25: The candidate did not meaningfully address the questions or showed fundamental gaps.
- 26–50: Some relevant content but significant weaknesses in depth, clarity, or accuracy.
- 51–70: Competent responses that address the questions adequately with room for improvement.
- 71–85: Strong responses with concrete examples, clear reasoning, and good depth.
- 86–100: Exceptional responses demonstrating mastery, original thinking, and strong communication.

# Recommendation mapping

Based on the average score across all categories:
- **rejeitar** (average < 35): Clear lack of fit — critical gaps in multiple areas.
- **talvez** (average 35–54): Mixed signals — some potential but notable concerns.
- **aceitar** (average 55–74): Qualified candidate with a solid overall performance.
- **excelente** (average ≥ 75): Outstanding candidate with consistently strong answers.

# Output

Respond with valid JSON only. No markdown, no explanation outside the JSON.`;

async function analisarRespostasComIA(
  respostas: RespostaAnalisada[],
  vagaTitulo: string,
  context?: {
    companyId?: string;
    userId?: string;
    interviewId?: string;
    sessionId?: string;
  },
): Promise<AnalisisResultado | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY não configurada");
    return null;
  }

  try {
    const startedAt = Date.now();
    const model = "gpt-4o-mini";
    const respostaFormatada = respostas
      .map(
        (r, idx) =>
          `P${idx + 1}: ${r.texto_pergunta}\nR${idx + 1}: ${r.resposta_texto}\nQualidade estimada: ${r.qualidade}`,
      )
      .join("\n\n");

    const response = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT_ANALISADOR,
        },
        {
          role: "user",
          content: `Vaga: ${vagaTitulo}
Total de perguntas: ${respostas.length}

${respostaFormatada}

Analisa estas respostas e devolve um JSON com esta estrutura:
{
  "pontos_fortes": ["3-4 pontos específicos baseados nas respostas"],
  "pontos_fracos": ["3-4 pontos específicos baseados nas respostas"],
  "scores": {
    "comunicacao": 0-100,
    "conhecimentoTecnico": 0-100,
    "profundidade": 0-100,
    "clareza": 0-100,
    "estruturacao": 0-100
  },
  "recomendacao_geral": "rejeitar" | "talvez" | "aceitar" | "excelente",
  "justificacao_recomendacao": "1-2 frases justificando a recomendação",
  "resumo_executivo": "2-3 frases sobre o desempenho geral do candidato",
  "sugestoes_melhoria": ["3-4 ações específicas que o candidato poderia melhorar"]
}

Responde apenas com JSON válido.`,
        },
      ],
    });

    await logAiUsage({
      companyId: context?.companyId || null,
      userId: context?.userId || null,
      interviewId: context?.interviewId || null,
      sessionId: context?.sessionId || null,
      feature: "analysis_summary",
      model,
      usage: response.usage,
      latencyMs: Date.now() - startedAt,
      metadata: {
        vagaTitulo,
        totalPerguntas: respostas.length,
      },
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    try {
      const parsed = JSON.parse(content);

      const scores = parsed.scores || {};
      const media =
        (scores.comunicacao +
          scores.conhecimentoTecnico +
          scores.profundidade +
          scores.clareza +
          scores.estruturacao) /
        5;

      return {
        candidato: undefined,
        data_analise: new Date().toISOString(),
        total_perguntas: respostas.length,
        pontos_fortes: parsed.pontos_fortes || [],
        pontos_fracos: parsed.pontos_fracos || [],
        scores: {
          comunicacao: scores.comunicacao || 0,
          conhecimentoTecnico: scores.conhecimentoTecnico || 0,
          profundidade: scores.profundidade || 0,
          clareza: scores.clareza || 0,
          estruturacao: scores.estruturacao || 0,
          media: Math.round(media * 10) / 10,
        },
        recomendacao_geral: parsed.recomendacao_geral || "talvez",
        justificacao_recomendacao: parsed.justificacao_recomendacao || "",
        resumo_executivo: parsed.resumo_executivo || "",
        sugestoes_melhoria: parsed.sugestoes_melhoria || [],
      };
    } catch (parseErr) {
      console.error("Erro ao fazer parse da análise:", parseErr);
      return null;
    }
  } catch (error) {
    console.error("Erro ao chamar análise com IA:", error);
    return null;
  }
}

/**
 * Full analysis of an interview session
 */
export async function analisarSessao(
  respostas: RespostaAnalisada[],
  vagaTitulo: string,
  emailCandidato?: string,
  context?: {
    companyId?: string;
    userId?: string;
    interviewId?: string;
    sessionId?: string;
  },
): Promise<{
  sucesso: boolean;
  dados?: AnalisisResultado;
  erro?: string;
}> {
  if (!respostas || respostas.length === 0) {
    return {
      sucesso: false,
      erro: "Nenhuma resposta para analisar",
    };
  }

  const analisis = await analisarRespostasComIA(respostas, vagaTitulo, context);

  if (!analisis) {
    return {
      sucesso: false,
      erro: "Erro ao gerar análise com IA",
    };
  }

  if (emailCandidato) {
    analisis.candidato = emailCandidato;
  }

  return {
    sucesso: true,
    dados: analisis,
  };
}

/**
 * Compare candidates (useful for leaderboard)
 */
export async function compararCandidatos(
  candidatos: Array<{
    nome: string;
    email: string;
    sessao_id?: string;
    analisis: AnalisisResultado;
  }>,
): Promise<{
  sucesso: boolean;
  dados?: {
    ranking: Array<{
      posicao: number;
      nome: string;
      email: string;
      sessao_id?: string;
      score_geral: number;
      scores_detalhes: Record<string, number>;
      reco: string;
    }>;
    vencedor: string;
    destaques: string[];
  };
  erro?: string;
}> {
  if (!candidatos || candidatos.length === 0) {
    return {
      sucesso: false,
      erro: "Nenhum candidato para comparar",
    };
  }

  const ranking = candidatos
    .map((c) => ({
      nome: c.nome,
      email: c.email,
      sessao_id: c.sessao_id,
      score_geral: c.analisis.scores.media,
      scores_detalhes: {
        comunicacao: c.analisis.scores.comunicacao,
        conhecimentoTecnico: c.analisis.scores.conhecimentoTecnico,
        profundidade: c.analisis.scores.profundidade,
        clareza: c.analisis.scores.clareza,
        estruturacao: c.analisis.scores.estruturacao,
      },
      reco: c.analisis.recomendacao_geral,
    }))
    .sort((a, b) => b.score_geral - a.score_geral)
    .map((item, idx) => ({
      posicao: idx + 1,
      ...item,
    }));

  const vencedor = ranking[0]?.nome || "N/A";

  const destaques = [];
  if (ranking[0]) {
    destaques.push(
      `🥇 ${ranking[0].nome}: Score ${ranking[0].score_geral.toFixed(1)} (${ranking[0].reco})`,
    );
  }
  if (ranking.length > 1) {
    destaques.push(
      `🥈 ${ranking[1].nome}: Score ${ranking[1].score_geral.toFixed(1)} (${ranking[1].reco})`,
    );
  }
  if (ranking.length > 2) {
    destaques.push(
      `🥉 ${ranking[2].nome}: Score ${ranking[2].score_geral.toFixed(1)} (${ranking[2].reco})`,
    );
  }

  return {
    sucesso: true,
    dados: {
      ranking,
      vencedor,
      destaques,
    },
  };
}
