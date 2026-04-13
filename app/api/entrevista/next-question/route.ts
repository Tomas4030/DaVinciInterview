// app/api/entrevista/next-question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { obterProximaPergunta } from "@/lib/openai-interviewer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      vagaTitulo,
      perguntaAtual,
      respostaUser,
      proximaPerguntaBase,
      iteracaoAtual,
    } = body;

    if (!vagaTitulo || !respostaUser) {
      return NextResponse.json(
        { error: "Parâmetros em falta" },
        { status: 400 },
      );
    }

    const resultado = await obterProximaPergunta({
      vagaTitulo,
      perguntaAtual,
      respostaUser,
      proximaPerguntaBase,
      iteracaoAtual,
    });

    return NextResponse.json({
      message: resultado.message,
      action: resultado.action,
      isOffTopic: resultado.isOffTopic ?? false,
    });
  } catch (error) {
    console.error("Erro na API next-question:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
