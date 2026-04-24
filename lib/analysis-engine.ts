/**
 * Analysys Engine para Entrevistas
 *
 * Analisa respostas usando IA estruturada para gerar:
 * - Pontos fortes e fracos
 * - Scores por categoria
 * - Recomendação geral
 */

import { OpenAI } from "openai";

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

const SYSTEM_PROMPT_ANALISADOR = `## ANALISTA DE ENTREVISTAS

Tu és um analista experiente de entrevistas técnicas e de RH. Tua função é:
1. Avaliar respostas de candidatos a entrevistas
2. Identificar pontos fortes e fracos
3. Atribuir scores objetivos por categoria
4. Fornecer recomendação clara (rejeitar/talvez/aceitar/excelente)

## CRITÉRIOS DE AVALIAÇÃO

### Comunicação (0-100)
- Clareza de linguagem
- Estrutura lógica das respostas
- Ausência de jargão desnecessário
- Capacidade de explicar ideias complexas

### Conhecimento Técnico (0-100)
- Demonstração de conhecimento relevante
- Precisão das informações técnicas
- Compreensão de conceitos-chave
- Experiência prática demonstrada

### Profundidade (0-100)
- Aprofundamento em tópicos
- Consideração de cenários complexos
- Exemplos concretos fornecidos
- Justificação de decisões

### Clareza (0-100)
- Facilidade de compreensão
- Organização das ideias
- Concisão apropriada
- Uso de exemplos efetivos

### Estruturação (0-100)
- Respostas bem organizadas
- Seguimento de sequência lógica
- Conclusões claras
- Capacidade de resumir

## RECOMENDAÇÕES

- REJEITAR: Score médio < 40 ou falhas críticas
- TALVEZ: Score médio 40-55 com fraquezas óbvias
- ACEITAR: Score médio 56-75, qualificado mas com espaço para melhoria
- EXCELENTE: Score médio > 75 com sólida demonstração

## RESPOSTAS

Sempre em JSON estruturado.`;

async function analisarRespostasComIA(
  respostas: RespostaAnalisada[],
  vagaTitulo: string,
): Promise<AnalisisResultado | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY não configurada");
    return null;
  }

  try {
    const respostaFormatada = respostas
      .map(
        (r, idx) =>
          `
      P${idx + 1}: ${r.texto_pergunta}
      R${idx + 1}: ${r.resposta_texto}
      Qualidade estimada: ${r.qualidade}
      `,
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT_ANALISADOR,
        },
        {
          role: "user",
          content: `
## ENTREVISTA PARA ANÁLISE

Vaga: ${vagaTitulo}
Total de perguntas: ${respostas.length}

${respostaFormatada}

## TAREFA

Analisa estas respostas e fornece um JSON com:
{
  "pontos_fortes": ["lista de 3-4 pontos"],
  "pontos_fracos": ["lista de 3-4 pontos"],
  "scores": {
    "comunicacao": número 0-100,
    "conhecimentoTecnico": número 0-100,
    "profundidade": número 0-100,
    "clareza": número 0-100,
    "estruturacao": número 0-100
  },
  "recomendacao_geral": "rejeitar" | "talvez" | "aceitar" | "excelente",
  "justificacao_recomendacao": "texto curto (1-2 frases)",
  "resumo_executivo": "2-3 frases sobre desempenho geral",
  "sugestoes_melhoria": ["3-4 acções específicas para melhorar"]
}

Responde APENAS em JSON válido.
          `.trim(),
        },
      ],
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
 * Análise completa de uma sessão de entrevista
 */
export async function analisarSessao(
  respostas: RespostaAnalisada[],
  vagaTitulo: string,
  emailCandidato?: string,
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

  const analisis = await analisarRespostasComIA(respostas, vagaTitulo);

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
 * Gerar análise comparando candidatos (útil para leaderboard)
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

  // Calcular ranking
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

  // Destaques
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
