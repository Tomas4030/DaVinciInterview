import { OpenAI } from "openai";

type SummaryInputItem = {
  question: string;
  answer: string;
};

export type ResponseSummary = {
  sentiment: "positivo" | "neutro" | "negativo";
  executiveSummary: string;
  strengths: string[];
  concerns: string[];
  source: "ai" | "heuristic";
};

// Accent-normalized tokens that indicate positive signals in Portuguese responses
const POSITIVE_HINTS = [
  "colabor", // colaboração, colaborei
  "resultado", // resultados
  "aprendi", // aprendi, aprendizagem
  "melhorei", // melhorei, melhoria
  "resolvi", // resolvi, resolução
  "lider", // liderança, liderei
  "objetivo", // objetivo, objetivos
  "entreg", // entrega, entreguei
  "implementei", // implementação
  "otimiz", // otimização, otimizei
  "conquist", // conquista, conquistei
  "desenvolvi", // desenvolvimento
  "contribui", // contribuição
  "eficien", // eficiência, eficiente
];

// Accent-normalized tokens that indicate concern signals
const NEGATIVE_HINTS = [
  "nao sei",
  "nao lembro",
  "nao tenho experiencia",
  "dificil",
  "complicado",
  "problema",
  "nunca fiz",
  "incerto",
  "nao consigo",
  "sem experiencia",
];

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function asNonEmptyList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
}

function buildHeuristicSummary(
  items: SummaryInputItem[],
  interviewTitle?: string,
): ResponseSummary {
  const answers = items.map((item) => item.answer).filter(Boolean);
  const normalized = normalizeText(answers.join(" \n "));
  const totalChars = answers.reduce((acc, answer) => acc + answer.length, 0);
  const averageChars =
    answers.length > 0 ? Math.round(totalChars / answers.length) : 0;

  const positiveScore = POSITIVE_HINTS.reduce(
    (acc, token) => acc + (normalized.includes(token) ? 1 : 0),
    0,
  );
  const negativeScore = NEGATIVE_HINTS.reduce(
    (acc, token) => acc + (normalized.includes(token) ? 1 : 0),
    0,
  );

  const sentiment: ResponseSummary["sentiment"] =
    positiveScore >= negativeScore + 2
      ? "positivo"
      : negativeScore >= positiveScore + 2
        ? "negativo"
        : "neutro";

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (averageChars >= 180) {
    strengths.push("Respostas com bom nível de detalhe e contexto.");
  } else if (averageChars >= 80) {
    strengths.push("Respostas com nível de detalhe razoável.");
  } else {
    concerns.push(
      "Respostas curtas em várias perguntas — pode faltar profundidade.",
    );
  }

  if (positiveScore >= 3) {
    strengths.push(
      "Linguagem orientada para resultados e aprendizagem contínua.",
    );
  } else if (positiveScore > 0) {
    strengths.push(
      "Alguns sinais de proatividade e orientação para resultados.",
    );
  }

  if (negativeScore >= 3) {
    concerns.push(
      "Vários sinais de insegurança ou falta de experiência relevante.",
    );
  } else if (negativeScore > 0) {
    concerns.push(
      "Alguns sinais de incerteza em pontos específicos da entrevista.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Respostas consistentes dentro do esperado para triagem inicial.",
    );
  }

  if (concerns.length === 0) {
    concerns.push(
      "Não foram detetados sinais críticos de risco nesta análise.",
    );
  }

  const detailLevel = averageChars >= 160 ? "detalhado" : "objetivo";
  const executiveSummary = interviewTitle
    ? `Resumo automático para "${interviewTitle}": perfil com tom ${sentiment} e conteúdo ${detailLevel}.`
    : `Resumo automático: perfil com tom ${sentiment} e conteúdo ${detailLevel}.`;

  return {
    sentiment,
    executiveSummary,
    strengths: strengths.slice(0, 3),
    concerns: concerns.slice(0, 3),
    source: "heuristic",
  };
}

function parseModelJson(content: string): Partial<ResponseSummary> | null {
  const trimmed = String(content || "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as Partial<ResponseSummary>;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(
        trimmed.slice(firstBrace, lastBrace + 1),
      ) as Partial<ResponseSummary>;
    } catch {
      return null;
    }
  }
}

export async function summarizeInterviewResponses(
  items: SummaryInputItem[],
  interviewTitle?: string | null,
): Promise<ResponseSummary> {
  const safeItems = items.filter((item) => item.answer.trim().length > 0);
  if (safeItems.length === 0) {
    return {
      sentiment: "neutro",
      executiveSummary: "Sem respostas suficientes para gerar resumo.",
      strengths: ["Não existem dados suficientes para avaliação."],
      concerns: ["Candidato não respondeu às perguntas da sessão."],
      source: "heuristic",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildHeuristicSummary(safeItems, interviewTitle || undefined);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const interviewContext = safeItems
      .map(
        (item, index) =>
          `P${index + 1}: ${item.question}\nR${index + 1}: ${item.answer}`,
      )
      .join("\n\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 420,
      messages: [
        {
          role: "system",
          content: `You are a recruitment analyst producing concise interview summaries. You write in European Portuguese (pt-PT). You respond with valid JSON only — no markdown, no text outside the JSON object.`,
        },
        {
          role: "user",
          content: `Analisa as respostas desta entrevista${interviewTitle ? ` para a vaga "${interviewTitle}"` : ""}.

${interviewContext}

Devolve um JSON com esta estrutura:
{
  "sentiment": "positivo" | "neutro" | "negativo",
  "executiveSummary": "2 frases curtas sobre o desempenho geral",
  "strengths": ["2-4 pontos fortes específicos observados nas respostas"],
  "concerns": ["2-4 riscos ou áreas de preocupação específicas"]
}

Critérios:
- "sentiment" reflete a impressão geral: positivo se o candidato demonstra competência e proatividade, negativo se há lacunas significativas, neutro se misto ou insuficiente para avaliar.
- Os pontos devem ser específicos e baseados no conteúdo das respostas — evita generalidades.
- Responde apenas com JSON válido.`,
        },
      ],
    });

    const parsed = parseModelJson(
      completion.choices[0]?.message?.content || "",
    );
    if (!parsed) {
      return buildHeuristicSummary(safeItems, interviewTitle || undefined);
    }

    const sentiment =
      parsed.sentiment === "positivo" || parsed.sentiment === "negativo"
        ? parsed.sentiment
        : "neutro";

    const executiveSummary = String(parsed.executiveSummary || "").trim();
    const strengths = asNonEmptyList(parsed.strengths);
    const concerns = asNonEmptyList(parsed.concerns);

    return {
      sentiment,
      executiveSummary:
        executiveSummary ||
        "Resumo gerado com base nas respostas desta sessão.",
      strengths:
        strengths.length > 0
          ? strengths
          : ["Boa consistência geral nas respostas fornecidas."],
      concerns:
        concerns.length > 0
          ? concerns
          : ["Sem riscos críticos identificados nesta análise inicial."],
      source: "ai",
    };
  } catch (error) {
    console.warn("[response-summary] fallback heuristic:", error);
    return buildHeuristicSummary(safeItems, interviewTitle || undefined);
  }
}
