import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import { validarSessao, removerSessao } from "@/lib/queries/candidatos";
import { validateLocalSession } from "@/lib/in-memory-verification";
import {
  buscarCandidaturaPorSessao,
  criarCandidatura,
} from "@/lib/queries/candidato-respostas";
import { withTimeout } from "@/lib/timeout";

const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = String(body?.slug || "").trim();
    const interviewId = String(body?.interviewId || "").trim();
    const sessionToken = String(body?.sessionToken || "").trim();
    const respostas = Array.isArray(body?.respostas) ? body.respostas : [];

    if (!slug || !interviewId || !sessionToken) {
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
    if (!interview) {
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
        "public-submit:validarSessao",
      );
    } catch (error) {
      sessao = validateLocalSession(sessionToken);
      console.warn("[public-submit] DB indisponível, validar sessão local.", error);
    }

    if (!sessao || sessao.vaga_id !== interview.id) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 401 },
      );
    }

    const existing = await buscarCandidaturaPorSessao(sessionToken, company.id);
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Entrevista já tinha sido submetida",
      });
    }

    await criarCandidatura(
      sessao.email,
      sessao.telefone,
      company.id,
      interview.id,
      interview.legacy_vaga_id || interview.id,
      sessionToken,
      respostas,
    );

    try {
      await removerSessao(sessionToken);
    } catch {
      // noop: a sessão pode já ter expirado ou sido limpa
    }

    return NextResponse.json({
      success: true,
      message: "Entrevista submetida com sucesso",
    });
  } catch (error) {
    console.error("[POST /api/public/interviews/submit]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
