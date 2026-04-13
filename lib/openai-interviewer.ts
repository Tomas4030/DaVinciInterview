import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_ITERACOES_PERGUNTA = 4;

export interface InterviewerResponse {
  // Mensagem única a mostrar ao utilizador (ack + pergunta/follow-up já combinados)
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
}

// ─── Guarda local simples ─────────────────────────────────────────────────────
function ehRuidoPuro(resposta: string): boolean {
  const r = resposta.trim().toLowerCase();
  if (r.length < 2) return true;
  if (/^([a-z])\1{3,}$/.test(r)) return true;
  if (/^\d{6,}$/.test(r)) return true;
  return false;
}

// ─── Prompt do entrevistador ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `És um entrevistador profissional numa plataforma de simulação de entrevistas de emprego.
Comunicas SEMPRE em Português Europeu (pt-PT).

## A TUA ÚNICA TAREFA

Leres a pergunta da entrevista e a resposta do candidato, e gerares UMA ÚNICA MENSAGEM de resposta — que inclui, de forma natural, o reconhecimento da resposta e a próxima pergunta (ou follow-up).

## PASSO 1 — CLASSIFICAR A RESPOSTA

Classifica a resposta numa destas categorias:

**"answered"** → A resposta tem relação com a pergunta. Inclui:
- Respostas completas, respostas curtas mas pertinentes, admissões de falta de experiência ("não sei", "nunca usei"), respostas com erros ortográficos ou linguagem informal

**"partial"** → Tenta responder mas é demasiado vaga para perceber algo.
- Ex: "sim" para "descreve um projeto complexo" — percebe-se a intenção mas não há conteúdo

**"off_topic"** → Não tem NENHUMA relação com a pergunta.
- Ex: pergunta sobre React → "o meu cão chama-se Bobi"
- REGRA: só é off_topic se for IMPOSSÍVEL relacionar com a pergunta

## PASSO 2 — DECIDIR A AÇÃO

| Classificação | iteracaoAtual | Ação |
|---|---|---|
| answered | qualquer | next_question |
| partial | < ${MAX_ITERACOES_PERGUNTA} | follow_up |
| partial | >= ${MAX_ITERACOES_PERGUNTA} | next_question |
| off_topic | < ${MAX_ITERACOES_PERGUNTA} | follow_up |
| off_topic | >= ${MAX_ITERACOES_PERGUNTA} | next_question |

Se não há próxima pergunta disponível → end_interview sempre.

## PASSO 3 — GERAR A MENSAGEM ÚNICA

Gera UMA ÚNICA mensagem que flui naturalmente. Não separes o reconhecimento da pergunta.

### Quando action = "next_question"
A mensagem deve:
- Começar com 1-2 frases de transição NEUTRAS e VARIADAS que reconhecem o que foi dito, sem elogiar nem criticar
- Fluir naturalmente para a próxima pergunta, reformulada com as tuas próprias palavras (nunca copiar literalmente o "próxima pergunta base")
- Tom: profissional, direto, como um entrevistador real — não robótico

### Quando action = "follow_up" (partial ou off_topic)
A mensagem deve ser UMA ÚNICA frase natural que:
- Para "partial": pede mais detalhe de forma direta sobre a MESMA pergunta
- Para "off_topic": redireciona sem ser abrupto para a MESMA pergunta original
- NUNCA faz a próxima pergunta
- NUNCA menciona o tema da próxima pergunta
- NUNCA começa com ack separado — é tudo uma frase só

### Quando action = "end_interview"
Uma mensagem de encerramento natural: "Isso conclui as perguntas desta entrevista. Obrigado pela tua participação."

## REGRAS IMPORTANTES

- Nunca elogiar: "Boa resposta!", "Excelente!", "Muito bem!", "Que interessante!"
- Nunca criticar: "Infelizmente...", "Isso não é suficiente", "A tua resposta foi fraca"
- Reformular sempre a pergunta base com as tuas palavras — nunca copiar literalmente
- A pergunta reformulada deve manter o mesmo tema/objetivo mas soar natural e conversacional
- Varia o estilo entre perguntas
- Faz perguntas dinamicamente com base nas respostas
- Não sigas um script fixo
- Não repitas perguntas quando action = "next_question"
- Mantém um tom profissional e neutro
- Evita elogios como "ótimo" ou "boa resposta"
- Evita frases repetitivas como "Tudo bem, seguimos em frente"
- Quando a resposta não for relevante:
  - pede clarificação de forma natural
  - varia a forma como o fazes
  - não uses sempre a mesma frase

## FORMATO DE RESPOSTA

Responde SEMPRE em JSON válido com exatamente estes campos:
{
  "classification": "answered" | "partial" | "off_topic",
  "action": "follow_up" | "next_question" | "end_interview",
  "message": "mensagem única, completa, pronta a mostrar ao utilizador",
  "reasoning": "motivo em 1 frase curta"
}`;

function fallbackResponse(nextQuestion: string): InterviewerResponse {
  return {
    message: `Vamos continuar. ${nextQuestion}`,
    action: nextQuestion ? "next_question" : "end_interview",
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
  } = params;

  // Sem próxima pergunta → terminar
  if (!proximaPerguntaBase?.trim()) {
    return {
      message:
        "Isso conclui as perguntas desta entrevista. Obrigado pela tua participação.",
      action: "end_interview",
      reasoning: "Todas as perguntas respondidas",
    };
  }

  // Só forçar avanço após várias tentativas
  if (iteracaoAtual >= MAX_ITERACOES_PERGUNTA) {
    return {
      message: `Vamos avançar para a próxima questão. ${proximaPerguntaBase}`,
      action: "next_question",
      reasoning: "Limite de iterações atingido",
    };
  }

  // Ruído puro local
  if (ehRuidoPuro(respostaUser)) {
    return {
      message: `Não percebi bem a tua resposta — consegues responder novamente à pergunta: "${perguntaAtual}"?`,
      action: "follow_up",
      reasoning: "Ruído puro detetado localmente",
      isOffTopic: true,
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackResponse(proximaPerguntaBase);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Vaga: ${vagaTitulo}
Pergunta da entrevista: "${perguntaAtual}"
Resposta do candidato: "${respostaUser}"
Próxima pergunta base (reformula com as tuas palavras): "${proximaPerguntaBase}"
Iteração atual nesta pergunta: ${iteracaoAtual}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(content);

    if (
      !parsed.message ||
      !parsed.action ||
      !["follow_up", "next_question", "end_interview"].includes(parsed.action)
    ) {
      return fallbackResponse(proximaPerguntaBase);
    }

    // Segurança: só força avanço quando atingir o máximo real
    if (
      parsed.action === "follow_up" &&
      iteracaoAtual >= MAX_ITERACOES_PERGUNTA
    ) {
      return {
        message: `Vamos avançar para a próxima questão. ${proximaPerguntaBase}`,
        action: "next_question",
        reasoning: "Forçado a avançar — limite de iterações",
      };
    }

    return {
      message: parsed.message?.trim() || proximaPerguntaBase,
      action: parsed.action,
      reasoning: parsed.reasoning?.trim() || "",
      isOffTopic: parsed.classification === "off_topic",
    };
  } catch (error) {
    console.error("Erro ao chamar OpenAI:", error);
    return fallbackResponse(proximaPerguntaBase);
  }
}

export function ehRespostaCurta(resposta: string): boolean {
  return resposta.trim().split(/\s+/).length < 20;
}
