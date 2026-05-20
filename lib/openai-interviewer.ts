import { OpenAI } from "openai";
import { logAiUsage } from "@/lib/ai-usage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_ITERACOES_PERGUNTA = 4;

export interface InterviewerResponse {
  message: string;
  action: "follow_up" | "next_question" | "end_interview";
  reasoning: string;
}

interface NextQuestionParams {
  vagaTitulo: string;
  perguntaAtual?: string;
  respostaUser: string;
  proximaPerguntaBase?: string;
  historicoRespostas?: Array<{ pergunta: string; resposta: string }>;
  iteracaoAtual?: number;
  companyName?: string;
  companyDescription?: string;
  interviewDescription?: string;
  interviewContext?: string;
  interviewQuestions?: any[];
  companyId?: string;
  sessionId?: string;
  interviewId?: string;
  userId?: string;
}

/**
 * Detects if the candidate's input is pure noise (gibberish, keyboard smash, etc.)
 * rather than a genuine attempt to answer.
 */
function ehRuidoPuro(resposta: string): boolean {
  const r = resposta.trim().toLowerCase();

  // Too short to be meaningful
  if (r.length < 2) return true;

  // Single character repeated (e.g. "aaaa", "gggg")
  if (/^([a-z])\1{3,}$/.test(r)) return true;

  // Long numeric string with no structure (e.g. "123456789")
  if (/^\d{6,}$/.test(r)) return true;

  // Keyboard smash patterns (e.g. "asdfgh", "qwerty" repeated)
  if (/^[asdfghjklqwertyuiopzxcvbnm]{1,3}$/i.test(r) && r.length <= 3)
    return true;

  // Only special characters or whitespace
  if (/^[\s\W]+$/.test(r)) return true;

  return false;
}

const SYSTEM_PROMPT = `You are a professional interviewer conducting a job interview on a recruitment platform.
You ALWAYS communicate in European Portuguese (pt-PT).

# Role

You behave exactly like a real human interviewer: calm, professional, neutral in tone. You never praise or criticise a candidate's answer — you simply acknowledge what was said and move on. Your goal is to keep the conversation flowing naturally while extracting the best possible answers from the candidate.

# Input

You receive:
- The current interview question
- The candidate's response
- The next base question to ask (if any)
- The current iteration count on this question (starts at 1)

# Step 1 — Classify the response

Classify the candidate's response as one of:

- **"answered"**: The response addresses the question. This includes short but relevant answers, admissions of lack of experience ("não tenho experiência com isso", "nunca utilizei"), answers with typos or informal language, or any genuine attempt that contains substance related to the topic.
- **"partial"**: The candidate tries to answer but the response is too vague to extract any useful information. For example, just "sim" or "já fiz isso" to a question asking for details about a complex project.
- **"off_topic"**: The response has no connection whatsoever to the question asked. Only classify as off_topic when it is genuinely impossible to relate the answer to the question.

When in doubt between "answered" and "partial", favour "answered". The threshold for "answered" is low — any meaningful engagement with the question qualifies.

# Step 2 — Decide the action

| Classification | Iteration | Action |
|---|---|---|
| answered | any | next_question |
| partial | < ${MAX_ITERACOES_PERGUNTA} | follow_up |
| partial | ≥ ${MAX_ITERACOES_PERGUNTA} | next_question |
| off_topic | < ${MAX_ITERACOES_PERGUNTA} | follow_up |
| off_topic | ≥ ${MAX_ITERACOES_PERGUNTA} | next_question |

If there is no next base question available:
- "answered" → end_interview
- "partial" or "off_topic" with iterations remaining → follow_up
- "partial" or "off_topic" at the limit → end_interview

# Step 3 — Write the message

Write a single, cohesive message. Never separate the acknowledgement from the question — it should read as one natural paragraph, the way a real interviewer would speak.

**When action = "next_question":**
- Begin with a brief, neutral transition (1 sentence max) that acknowledges the topic of what the candidate said — without evaluating it.
- Flow naturally into the next question, rephrased in your own words. Do not copy the base question verbatim.
- Vary your transitions. Do not start every message the same way. Avoid formulaic openers like "Certo, vamos continuar" or "Muito bem, passemos à próxima".
- Keep it conversational and direct.

**When action = "follow_up":**
- Write a single natural sentence that asks for more detail (for "partial") or gently redirects to the original question (for "off_topic").
- Stay on the SAME question — never introduce the next question or hint at its topic.
- Vary how you ask for clarification. Do not repeat the same phrasing across follow-ups.

**When action = "end_interview":**
- Write a brief, professional closing: "Estas foram todas as perguntas que tinha preparadas. Obrigado pela tua participação nesta entrevista."

# Constraints

- Never praise ("boa resposta", "excelente", "muito bem").
- Never criticise ("isso não responde", "resposta fraca").
- Never use filler phrases like "Compreendo perfeitamente" or "Essa é uma boa questão".
- Never ask more than one question per message.
- When rephrasing a question, keep the same intent and scope but use different words and sentence structure.
- Maintain a professional, warm but neutral tone throughout — similar to a structured interview at a well-run company.
- Write concisely. The full message should be 2–4 sentences maximum.

# Output format

Respond with valid JSON only:
{
  "classification": "answered" | "partial" | "off_topic",
  "action": "follow_up" | "next_question" | "end_interview",
  "message": "the complete message to show the candidate",
  "reasoning": "1 short sentence explaining your decision"
}`;

function fallbackResponse(
  nextQuestion: string,
  isUltimaPergunta: boolean,
): InterviewerResponse {
  return {
    message: isUltimaPergunta
      ? "Estas foram todas as perguntas que tinha preparadas. Obrigado pela tua participação nesta entrevista."
      : `Vamos continuar. ${nextQuestion}`,
    action: isUltimaPergunta ? "end_interview" : "next_question",
    reasoning: "Fallback por erro na API",
  };
}

export async function obterProximaPergunta(
  params: NextQuestionParams,
): Promise<InterviewerResponse & { isOffTopic?: boolean }> {
  const {
    vagaTitulo,
    perguntaAtual,
    respostaUser,
    proximaPerguntaBase = "",
    iteracaoAtual = 1,
    companyName = "",
    companyDescription = "",
    interviewDescription = "",
    interviewContext = "",
    interviewQuestions = [],
    companyId = "",
    sessionId = "",
    interviewId = "",
    userId = "",
  } = params;

  const isUltimaPergunta = !proximaPerguntaBase?.trim();

  // Handle pure noise locally — no need to spend an API call
  if (ehRuidoPuro(respostaUser)) {
    if (iteracaoAtual >= MAX_ITERACOES_PERGUNTA) {
      return {
        message: isUltimaPergunta
          ? "Estas foram todas as perguntas que tinha preparadas. Obrigado pela tua participação nesta entrevista."
          : `Vamos avançar para a próxima questão. ${proximaPerguntaBase}`,
        action: isUltimaPergunta ? "end_interview" : "next_question",
        reasoning: "Limite de iterações atingido com ruído puro",
        isOffTopic: true,
      };
    }

    return {
      message: `Não consegui perceber a tua resposta. Podes tentar responder novamente à pergunta?`,
      action: "follow_up",
      reasoning: "Ruído puro detetado localmente",
      isOffTopic: true,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackResponse(proximaPerguntaBase, isUltimaPergunta);
  }

  try {
    const startedAt = Date.now();
    const model = "gpt-4o-mini";

    // Build context string, keeping it concise to stay within token budget
    const questionsContext = Array.isArray(interviewQuestions)
      ? JSON.stringify(interviewQuestions).slice(0, 2500)
      : "[]";

    const response = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Empresa: ${companyName || "N/A"}
          Descrição da empresa: ${companyDescription || "N/A"}
          Vaga: ${vagaTitulo}
          Descrição da vaga: ${interviewDescription || "N/A"}
          Contexto adicional: ${interviewContext || "N/A"}
          Perguntas da entrevista (para contexto): ${questionsContext}
          Pergunta atual: "${perguntaAtual}"
          Resposta do candidato: "${respostaUser}"
          Próxima pergunta base (reformula com as tuas palavras): "${proximaPerguntaBase}"
          Iteração atual nesta pergunta: ${iteracaoAtual}`,
        },
      ],
    });

    await logAiUsage({
      companyId: companyId || null,
      userId: userId || null,
      interviewId: interviewId || null,
      sessionId: sessionId || null,
      feature: "interview_next_question",
      model,
      usage: response.usage,
      latencyMs: Date.now() - startedAt,
      metadata: {
        vagaTitulo,
        iteracaoAtual,
      },
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(content);

    // Validate the parsed response has required fields and valid action
    if (
      !parsed.message ||
      !parsed.action ||
      !["follow_up", "next_question", "end_interview"].includes(parsed.action)
    ) {
      return fallbackResponse(proximaPerguntaBase, isUltimaPergunta);
    }

    // Safety net: force advancement if AI returns follow_up but we've hit the iteration limit
    if (
      parsed.action === "follow_up" &&
      iteracaoAtual >= MAX_ITERACOES_PERGUNTA
    ) {
      return {
        message: isUltimaPergunta
          ? "Estas foram todas as perguntas que tinha preparadas. Obrigado pela tua participação nesta entrevista."
          : `Vamos avançar para a próxima questão. ${proximaPerguntaBase}`,
        action: isUltimaPergunta ? "end_interview" : "next_question",
        reasoning: "Forçado a avançar — limite de iterações",
      };
    }

    let finalAction = parsed.action as
      | "follow_up"
      | "next_question"
      | "end_interview";

    let finalMessage = parsed.message?.trim() || proximaPerguntaBase;

    // If there's no next question and the model says next_question, end the interview
    if (isUltimaPergunta && finalAction === "next_question") {
      finalAction = "end_interview";
      finalMessage =
        "Estas foram todas as perguntas que tinha preparadas. Obrigado pela tua participação nesta entrevista.";
    }

    return {
      message: finalMessage,
      action: finalAction,
      reasoning: parsed.reasoning?.trim() || "",
      isOffTopic: parsed.classification === "off_topic",
    };
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    return fallbackResponse(proximaPerguntaBase, isUltimaPergunta);
  }
}

export function ehRespostaCurta(resposta: string): boolean {
  return resposta.trim().split(/\s+/).length < 20;
}
