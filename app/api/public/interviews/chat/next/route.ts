import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import { validarSessao } from "@/lib/queries/candidatos";
import { validateLocalSession } from "@/lib/in-memory-verification";
import { obterProximaPergunta } from "@/lib/openai-interviewer";
import {
  extractInterviewContextFromDescription,
  stripInterviewMetaFromDescription,
} from "@/lib/interview-meta";
import { withTimeout } from "@/lib/timeout";

const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = String(body?.slug || "").trim();
    const interviewId = String(body?.interviewId || "").trim();
    const sessionToken = String(body?.sessionToken || "").trim();
    const perguntaAtual = String(body?.perguntaAtual || "").trim();
    const respostaUser = String(body?.respostaUser || "").trim();
    const proximaPerguntaBase = String(body?.proximaPerguntaBase || "").trim();
    const iteracaoAtual = Number(body?.iteracaoAtual || 1);

    if (!slug || !interviewId || !sessionToken || !respostaUser) {
      return NextResponse.json(
        { error: "Parâmetros em falta" },
        { status: 400 },
      );
    }

    const company = await getCompanyBySlug(slug);
    if (!company || company.subscription_status === "canceled") {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const interview = await getInterviewById(interviewId, company.id);
    if (!interview || interview.status !== "published") {
      return NextResponse.json(
        { error: "Entrevista não encontrada" },
        { status: 404 },
      );
    }

    let sessao = null;
    try {
      sessao = await withTimeout(
        validarSessao(sessionToken),
        DB_OP_TIMEOUT_MS,
        "public-chat-next:validarSessao",
      );
    } catch (error) {
      sessao = validateLocalSession(sessionToken);
      console.warn("[public-chat-next] DB indisponível, validar sessão local.", error);
    }

    if (!sessao || sessao.vaga_id !== interview.id) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 401 },
      );
    }

    const resultado = await obterProximaPergunta({
      vagaTitulo: interview.title,
      perguntaAtual,
      respostaUser,
      proximaPerguntaBase,
      iteracaoAtual,
      companyName: company.name,
      companyDescription: company.description || "",
      companyId: company.id,
      sessionId: sessionToken,
      interviewId: interview.id,
      interviewDescription: stripInterviewMetaFromDescription(
        interview.description || "",
      ),
      interviewContext: extractInterviewContextFromDescription(
        interview.description || "",
      ),
      interviewQuestions: Array.isArray(interview.questions) ? interview.questions : [],
    });

    return NextResponse.json({
      message: resultado.message,
      action: resultado.action,
      isOffTopic: resultado.isOffTopic ?? false,
    });
  } catch (error) {
    console.error("[POST /api/public/interviews/chat/next]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
