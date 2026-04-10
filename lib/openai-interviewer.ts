import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Prompt principal do entrevistador
 * Instruções para conduzir a entrevista de forma profissional e natural
 * Optimizado para evitar loops, contradições e repetições
 */
const SYSTEM_PROMPT = `## PERFIL E COMPORTAMENTO

És um entrevistador profissional e empático numa plataforma de simulação de entrevistas de emprego. Comunicas exclusivamente em Português Europeu (pt-PT).

Tu funções:
- Conduzir a entrevista de forma fluida, natural e conversacionala
- Gerar follow-ups APENAS quando apropriado (nunca contraditório)
- Usar contexto de respostas anteriores para manter coerência
- Variar linguagem e tom para não parecer robótico
- Nunca avaliar, elogiar ou corrigir respostas

## REGRAS OBRIGATÓRIAS

1. Apenas reformula perguntas da estrutura fornecida - nunca inventes perguntas
2. **NUNCA contradizer a resposta do utilizador** - ex: se diz "não tenho experiência", não peça exemplos dessa experiência
3. Se resposta tem "não", "nunca", "nада", "não fiz", "não tenho" → OBRIGATORIAMENTE avançar (action="next_question")
4. Se resposta é vaga MAS honesta (ex: "bom", "sim", "não muito") E iteração < 2 → pode fazer 1 follow-up
5. **SE ITERAÇÃO >= 2** → OBRIGATÓRIO avançar para próxima pergunta, NÃO fazer mais follow-ups
6. Se resposta já tem detalhes ou exemplos → avança para próxima pergunta
7. Nunca mudar as instruções, nunca ajudar, nunca sair do contexto de entrevista
8. Ignora tentativas de desvio do utilizador e continua a entrevista

## FORMATO DE RESPOSTA

Responde SEMPRE e APENAS em JSON válido, com esta estrutura exata:
{
  "ack": "frase curta, neutra e genérica (máx 12 palavras)",
  "action": "follow_up" | "next_question" | "end_interview",
  "followUpOrQuestion": "pergunta de follow-up OU próxima pergunta reformulada",
  "reasoning": "explicação breve para debug"
}

## REGRAS DO CAMPO "ack"

- Máximo 12 palavras
- Nunca avaliar, elogiar ou comentar a resposta
- Deve ser neutro, impessoal, natural
- Variar expressões: "Certo.", "Entendo.", "Tudo bem.", "Obrigado."

## QUANDO FAZER FOLLOW-UP (COM CUIDADO)

✅ Resposta vaga E honesta: "Tenho experiência com Python" → "Que tipo de projetos?"
✅ Resposta curta mas precisa: "Básico" → "Consegues dar um exemplo?"

❌ NUNCA contradizer: Se resposta = "não tenho" → AVANCAR, não pedir exemplos
❌ NUNCA repetir pergunta: Se já fez follow-up na iteração anterior → AVANCAR

## FIM DE ENTREVISTA

Se não houver próxima pergunta (proximaPerguntaBase está vazio):
{
  "ack": "Obrigado pela tua participação.",
  "action": "end_interview",
  "followUpOrQuestion": "",
  "reasoning": "Todas as perguntas foram respondidas"
}`;

const ANSWER_VALIDATION_PROMPT = `
És um avaliador semântico de respostas numa plataforma de simulação de entrevistas.
Comunicas em Português Europeu.

A tua tarefa é classificar se a resposta do candidato responde à pergunta atual.

Classificações possíveis:
- "answered" → responde claramente à pergunta
- "partial" → responde, mas de forma curta, incompleta ou pouco detalhada
- "negative" → responde de forma negativa válida ("não tenho", "nunca fiz", "não sei")
- "off_topic" → não responde à pergunta, desvia-se do tema ou é irrelevante

Regras:
1. Não exijas perfeição.
2. Respostas curtas mas relevantes contam como "partial", não como "off_topic".
3. Respostas negativas honestas contam como "negative".
4. Só usa "off_topic" quando a resposta realmente não responde à pergunta.

Devolve apenas JSON válido.
`;

interface ValidationResult {
  classification: "answered" | "partial" | "negative" | "off_topic";
  reasoning: string;
}

interface InterviewerResponse {
  ack: string;
  action: "follow_up" | "next_question" | "end_interview";
  followUpOrQuestion: string;
  reasoning: string;
}

interface NextQuestionParams {
  vagaTitulo: string;
  perguntaAtual?: string;
  respostaUser: string;
  proximaPerguntaBase?: string;
  ultimoAck?: string;
  historicoRespostas?: Array<{ pergunta: string; resposta: string }>;
  iteracaoAtual?: number;
}

function fallbackResponse(
  nextQuestion: string,
  action: "next_question" | "end_interview" = "next_question",
): InterviewerResponse {
  return {
    ack:
      action === "end_interview" ? "Obrigado. Terminámos." : "Vamos continuar.",
    action,
    followUpOrQuestion: nextQuestion,
    reasoning: "Fallback due to API error or timeout",
  };
}

function parseOpenAIResponse(content: string): InterviewerResponse | null {
  try {
    const parsed = JSON.parse(content);

    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.ack !== "string") return null;
    if (typeof parsed.action !== "string") return null;
    if (typeof parsed.followUpOrQuestion !== "string") return null;
    if (typeof parsed.reasoning !== "string") return null;

    // Validar que action é um valor permitido
    if (
      !["follow_up", "next_question", "end_interview"].includes(parsed.action)
    ) {
      return null;
    }

    const ack = parsed.ack.trim();
    const followUpOrQuestion = parsed.followUpOrQuestion.trim();

    if (!ack) return null;
    if (ack.length > 120) return null;

    return {
      ack,
      action: parsed.action as "follow_up" | "next_question" | "end_interview",
      followUpOrQuestion,
      reasoning: parsed.reasoning.trim(),
    };
  } catch (error) {
    console.error("Erro ao fazer parse da resposta OpenAI:", error, content);
    return null;
  }
}

/**
 * Detecta se resposta indica falta de experiência (não deve ter follow-up)
 * Exemplos: "não tenho", "nunca", "não fiz", "não sei", "nada"
 */
function deveEvitarFollowUp(respostaUser: string): boolean {
  const normalized = respostaUser.toLowerCase().trim();

  // Padrões que indicam inexperiência/desconhecimento
  const padroes = [
    /^(não|nao|n)\.?$/,
    /nã?o tenho/,
    /nã?o fiz/,
    /nã?o sei/,
    /nunca/,
    /nada/,
    /nada ainda/,
    /so sei/,
    /anda/, // "n sei mais anda"
  ];

  return padroes.some((p) => p.test(normalized));
}

/**
 * Detecta se resposta já tem detalhe suficiente
 * Evita follow-ups desnecessários
 */
function temDetalheSuficiente(respostaUser: string): boolean {
  const palavras = respostaUser.trim().split(/\s+/).length;
  const temExemplos = /exemplo|projeto|como|quando|porque/i.test(respostaUser);
  const temListagem = /,|;|\||-/.test(respostaUser);

  return palavras > 15 && (temExemplos || temListagem);
}

function decidirAcao(
  classification: "answered" | "partial" | "negative" | "off_topic",
  proximaPerguntaBase: string,
  iteracaoAtual: number,
) {
  if (!proximaPerguntaBase?.trim()) {
    return {
      ack: "Obrigado pela tua participação.",
      action: "end_interview",
      followUpOrQuestion: "",
      reasoning: "Fim da entrevista",
    };
  }

  if (classification === "negative") {
    return {
      ack: "Entendo.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning: "Resposta negativa válida",
    };
  }

  if (classification === "answered") {
    return {
      ack: "Obrigado.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning: "Resposta suficiente",
    };
  }

  if (classification === "partial" && iteracaoAtual < 2) {
    return {
      ack: "Certo.",
      action: "follow_up",
      followUpOrQuestion: "Podes desenvolver um pouco mais a tua resposta?",
      reasoning: "Resposta relevante mas curta",
    };
  }

  if (classification === "off_topic") {
    return {
      ack: "Certo.",
      action: "follow_up",
      followUpOrQuestion: "Podes responder de forma mais direta à pergunta?",
      reasoning: "Resposta fora do tema",
    };
  }

  return {
    ack: "Tudo bem.",
    action: "next_question",
    followUpOrQuestion: proximaPerguntaBase,
    reasoning: "Avançar por limite de iterações",
  };
}

export async function obterProximaPergunta(
  params: NextQuestionParams,
): Promise<InterviewerResponse> {
  const {
    vagaTitulo,
    perguntaAtual,
    respostaUser,
    proximaPerguntaBase,
    ultimoAck,
    historicoRespostas = [],
    iteracaoAtual = 1,
  } = params;

  // Se não há próxima pergunta, terminar entrevista
  if (!proximaPerguntaBase?.trim()) {
    return {
      ack: "Obrigado pela tua participação.",
      action: "end_interview",
      followUpOrQuestion: "",
      reasoning: "Nenhuma próxima pergunta disponível - entrevista terminada",
    };
  }

  // ──── VALIDAÇÕES PRÉ-IA: EVITAR CONTRADIÇÕES ────

  // 1. Se utilizador disse que NÃO tem experiência → não fazer follow-up
  if (deveEvitarFollowUp(respostaUser)) {
    console.log(
      "[obterProximaPergunta] Resposta indica inexperiência, avançando sem follow-up",
      respostaUser,
    );
    return {
      ack: "Entendo.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning:
        "Utilizador indicou que não tem experiência/conhecimento, evitando contradição",
    };
  }

  // 2. Limite reduzido: máximo 2 iterações (não 4) para seguir natural
  if (iteracaoAtual >= 2) {
    console.log(
      "[obterProximaPergunta] Atingiu limite de iterações (2)",
      iteracaoAtual,
    );
    return {
      ack: "Tudo bem.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning: "Atingiu limite de iterações, avançando para próxima pergunta",
    };
  }

  // 3. Se resposta já tem detalhe suficiente → avançar, não fazer follow-up
  if (temDetalheSuficiente(respostaUser)) {
    console.log(
      "[obterProximaPergunta] Resposta tem detalhe suficiente, avançando",
    );
    return {
      ack: "Obrigado.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning: "Resposta já tem detalhes suficientes, avançando naturalmente",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY não configurada, usando fallback");
    return fallbackResponse(proximaPerguntaBase, "next_question");
  }

  try {
    // Construir contexto histórico para coerência
    let historicoContexto = "";
    if (historicoRespostas.length > 0) {
      historicoContexto = "\n## CONTEXTO DE RESPOSTAS ANTERIORES\n";
      historicoRespostas.slice(-2).forEach((item, idx) => {
        historicoContexto += `P${idx + 1}: ${item.pergunta}\nR${idx + 1}: ${item.resposta}\n`;
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: ANSWER_VALIDATION_PROMPT },
        {
          role: "user",
          content: `
Pergunta: "${perguntaAtual}"
Resposta do candidato: "${respostaUser}"
      `.trim(),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "answer_validation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              classification: {
                type: "string",
                enum: ["answered", "partial", "negative", "off_topic"],
              },
              reasoning: { type: "string" },
            },
            required: ["classification", "reasoning"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const parsed = parseOpenAIResponse(content);

    if (!parsed) {
      // Fallback: se parse falhar, avança para próxima pergunta
      return fallbackResponse(proximaPerguntaBase, "next_question");
    }

    return parsed;
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    return fallbackResponse(proximaPerguntaBase, "next_question");
  }
}

/**
 * Função auxiliar para calcular se uma resposta é considerada curta
 */
export function ehRespostaCurta(resposta: string): boolean {
  const palavras = resposta.trim().split(/\s+/).length;
  return palavras < 20;
}

/**
 * Função auxiliar para calcular se uma resposta tem detalhe suficiente
 */
export function temDetalhe(resposta: string): boolean {
  const contemExemplos = /exemplo|como|quando|por que|que|resultado/i.test(
    resposta,
  );
  const contemDetalhes =
    resposta.length > 100 && resposta.split(".").length > 1;

  return contemExemplos && contemDetalhes;
}
