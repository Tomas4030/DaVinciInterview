import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface InterviewerResponse {
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
  historicoRespostas?: Array<{ pergunta: string; resposta: string }>;
  iteracaoAtual?: number;
}

// ─── Guarda local simples (só para os casos mais óbvios) ──────────────────────
// NÃO tenta validar conteúdo técnico — apenas descarta ruído puro
function ehRuidoPuro(resposta: string): boolean {
  const r = resposta.trim().toLowerCase();

  // Menos de 2 caracteres
  if (r.length < 2) return true;

  // Sequências sem sentido: "asdfgh", "aaaaa", "zzz"
  if (/^([a-z])\1{3,}$/.test(r)) return true;

  // Só números aleatórios longos sem contexto
  if (/^\d{6,}$/.test(r)) return true;

  return false;
}

// ─── Prompt do entrevistador ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `És um entrevistador profissional numa plataforma de simulação de entrevistas de emprego.
Comunicas SEMPRE em Português Europeu (pt-PT).

## A TUA ÚNICA TAREFA

Ler a pergunta da entrevista e a resposta do candidato, e decidir o que fazer a seguir.

## PASSO 1 — CLASSIFICAR A RESPOSTA

Classifica a resposta numa destas categorias:

**"answered"** → A resposta tem relação com a pergunta. Exemplos:
- "ja trabalho com bases de dados há 3 anos" para pergunta sobre SQL ✓
- "uso com bastante frequência" para pergunta sobre tecnologia ✓
- "não sei muito bem" para pergunta técnica ✓
- "nunca usei" para pergunta sobre experiência ✓
- Erros de ortografia, gírias e linguagem informal NÃO invalidam a resposta ✓

**"partial"** → Tenta responder mas é demasiado vaga para perceber algo. Exemplos:
- "sim" para "descreve um projeto complexo"
- "é bom" para "como garantis qualidade de código"

**"negative"** → Resposta negativa honesta sobre falta de experiência. Exemplos:
- "não sei", "nunca usei", "não tenho experiência com isso", "não"

**"off_topic"** → A resposta NÃO tem NENHUMA relação com a pergunta. Exemplos:
- Pergunta sobre testes automatizados → "hj ta som sabias?" (gíria sem sentido)
- Pergunta sobre bases de dados → "agua azul dias perto e sol vermelho" (poesia/texto aleatório)
- Pergunta sobre React → "o meu cão chama-se Bobi" (tópico completamente diferente)
- REGRA: só é off_topic se for IMPOSSÍVEL relacionar com a pergunta

## PASSO 2 — DECIDIR A AÇÃO

| Classificação | iteracaoAtual | Ação |
|---|---|---|
| answered | qualquer | next_question |
| negative | qualquer | next_question |
| partial | 1 | follow_up (pedir mais detalhe) |
| partial | >= 2 | next_question |
| off_topic | 1 | follow_up (pedir resposta à pergunta) |
| off_topic | >= 2 | next_question |

Se não há próxima pergunta disponível → end_interview sempre.

## PASSO 3 — FORMATO DE RESPOSTA

Responde SEMPRE em JSON válido com exatamente estes campos:
{
  "classification": "answered" | "partial" | "negative" | "off_topic",
  "ack": "frase neutra, máx 6 palavras",
  "action": "follow_up" | "next_question" | "end_interview",
  "followUpOrQuestion": "texto da pergunta seguinte ou follow-up",
  "reasoning": "motivo em 1 frase curta"
}

## REGRAS PARA O CAMPO "ack"

- Nunca elogiar: ❌ "Boa resposta!", "Excelente!", "Muito bem!"
- Nunca criticar: ❌ "Infelizmente...", "Isso não é correto"
- Sempre neutro: ✓ "Obrigado.", "Certo.", "Entendo.", "Tudo bem.", "Vamos continuar."
- Máximo 6 palavras

## REGRA PARA follow_up quando off_topic

Quando a resposta é off_topic E iteracaoAtual === 1, o followUpOrQuestion deve ser:
"Não percebi a ligação com a pergunta. Consegues responder sobre [tema da pergunta]?"`;

function fallbackResponse(nextQuestion: string): InterviewerResponse {
  return {
    ack: "Vamos continuar.",
    action: nextQuestion ? "next_question" : "end_interview",
    followUpOrQuestion: nextQuestion,
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
      ack: "Obrigado pela tua participação.",
      action: "end_interview",
      followUpOrQuestion: "",
      reasoning: "Todas as perguntas respondidas",
    };
  }

  // Limite de iterações → avançar sempre, independentemente da resposta
  if (iteracaoAtual >= 2) {
    return {
      ack: "Tudo bem.",
      action: "next_question",
      followUpOrQuestion: proximaPerguntaBase,
      reasoning: "Limite de iterações atingido",
    };
  }

  // Ruído puro local (casos óbvios sem gastar API)
  if (ehRuidoPuro(respostaUser)) {
    return {
      ack: "Não percebi.",
      action: "follow_up",
      followUpOrQuestion: `Consegues responder à pergunta sobre ${perguntaAtual?.toLowerCase().slice(0, 40)}...?`,
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
      temperature: 0,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Vaga: ${vagaTitulo}
Pergunta da entrevista: "${perguntaAtual}"
Resposta do candidato: "${respostaUser}"
Próxima pergunta disponível: "${proximaPerguntaBase}"
Iteração atual nesta pergunta: ${iteracaoAtual}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(content);

    if (
      !parsed.ack ||
      !parsed.action ||
      !["follow_up", "next_question", "end_interview"].includes(parsed.action)
    ) {
      return fallbackResponse(proximaPerguntaBase);
    }

    // Segurança: se a IA quer fazer follow_up mas já estamos na iteração 2 → forçar avanço
    if (parsed.action === "follow_up" && iteracaoAtual >= 2) {
      return {
        ack: "Tudo bem.",
        action: "next_question",
        followUpOrQuestion: proximaPerguntaBase,
        reasoning: "Forçado a avançar — limite de iterações",
      };
    }

    return {
      ack: parsed.ack?.trim() || "Obrigado.",
      action: parsed.action,
      followUpOrQuestion:
        parsed.followUpOrQuestion?.trim() || proximaPerguntaBase,
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
