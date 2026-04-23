import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import { criarSessao } from "@/lib/queries/candidatos";
import { consumirCodigoVerificacaoEntrevista } from "@/lib/queries/interview-verification";
import {
  createLocalSession,
  verifyLocalVerificationCode,
} from "@/lib/in-memory-verification";
import { withTimeout } from "@/lib/timeout";

const INTERVIEW_SESSION_TTL_MINUTES = 30;
const DB_OP_TIMEOUT_MS = Number(process.env.DB_OP_TIMEOUT_MS || 3000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = String(body?.slug || "").trim();
    const interviewId = String(body?.interviewId || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const code = String(body?.code || "").trim();

    if (!slug || !interviewId || !email || !code) {
      return NextResponse.json(
        { error: "Dados obrigatórios em falta" },
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

    let verificationResult:
      | {
          email: string;
          telefone: string;
          candidate_name: string;
        }
      | null = null;

    try {
      verificationResult = await withTimeout(
        consumirCodigoVerificacaoEntrevista(email, code, company.id, interview.id),
        DB_OP_TIMEOUT_MS,
        "public-verify-code:consumirCodigoVerificacaoEntrevista",
      );
    } catch (error) {
      const fallbackEmailKey = `${email}|${company.id}|${interview.id}`;
      const ok = verifyLocalVerificationCode(fallbackEmailKey, code);
      if (!ok) {
        verificationResult = null;
      } else {
        verificationResult = {
          email,
          telefone: String(body?.telefone || "").trim(),
          candidate_name: String(body?.candidateName || "").trim() || "Candidato",
        };
      }
      console.warn(
        "[public-verify-code] DB indisponível, verificação em memória.",
        error,
      );
    }

    if (!verificationResult) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    let sessionToken = "";
    let expiresAt = new Date(
      Date.now() + INTERVIEW_SESSION_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    try {
      sessionToken = await withTimeout(
        criarSessao(
          verificationResult.email,
          verificationResult.telefone,
          interview.id,
          INTERVIEW_SESSION_TTL_MINUTES,
        ),
        DB_OP_TIMEOUT_MS,
        "public-verify-code:criarSessao",
      );
    } catch (error) {
      const localSession = createLocalSession(
        verificationResult.email,
        verificationResult.telefone,
        interview.id,
        INTERVIEW_SESSION_TTL_MINUTES,
      );
      sessionToken = localSession.sessionToken;
      expiresAt = localSession.expiresAt;
      console.warn(
        "[public-verify-code] DB indisponível, sessão criada em memória.",
        error,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso",
      sessionToken,
      expiresAt,
      candidateName: verificationResult.candidate_name,
      email: verificationResult.email,
      telefone: verificationResult.telefone,
    });
  } catch (error) {
    console.error("[POST /api/public/interviews/verification/verify]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
