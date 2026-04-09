// app/api/entrevista/next-question/route.ts
// POST /api/entrevista/next-question
// Recebe a resposta do candidato e a próxima pergunta base
// Retorna a resposta reformulada pelo entrevistador (OpenAI)

import { NextRequest, NextResponse } from "next/server";
import { obterProximaPergunta } from "@/lib/openai-interviewer";

interface RequestBody {
  vagaTitulo: string;
  perguntaAtual?: string;
  respostaUser: string;
  proximaPerguntaBase: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { vagaTitulo, perguntaAtual, respostaUser, proximaPerguntaBase } =
      body;

    // Validar campos obrigatórios
    if (!vagaTitulo || !respostaUser || !proximaPerguntaBase) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vagaTitulo, respostaUser, proximaPerguntaBase",
        },
        { status: 400 },
      );
    }

    const resultado = await obterProximaPergunta({
      vagaTitulo,
      perguntaAtual,
      respostaUser,
      proximaPerguntaBase,
    });

    return NextResponse.json(
      {
        success: true,
        ack: resultado.ack,
        nextQuestion: resultado.nextQuestion,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/entrevista/next-question]", error);
    return NextResponse.json(
      {
        error: "Failed to generate next question",
        success: false,
        ack: "Obrigado. Vamos continuar.",
        nextQuestion: "",
      },
      { status: 500 },
    );
  }
}
