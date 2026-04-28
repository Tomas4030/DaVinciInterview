import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

type GenerateQuestionsRequest = {
  companySlug?: string;
  companyId?: string;
  jobTitle?: string;
  jobDescription?: string;
  interviewContext?: string;
  questionCount?: number;
};

function clampQuestionCount(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 5;
  return Math.max(1, Math.min(20, Math.floor(numeric)));
}

function normalizeGeneratedQuestions(raw: unknown, maxCount: number): Array<{ question: string }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item?.question === "string") return item.question.trim();
      return "";
    })
    .filter(Boolean)
    .slice(0, maxCount)
    .map((question) => ({ question }));
}

function normalizeQuestionsFromText(raw: string, maxCount: number): Array<{ question: string }> {
  return String(raw || "")
    .split("\n")
    .map((line) => line.replace(/^\s*(\d+[\).:-]?|[-*])\s*/, "").trim())
    .filter((line) => line.length > 8 && line.endsWith("?"))
    .slice(0, maxCount)
    .map((question) => ({ question }));
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateQuestionsRequest;
    const companySlug = String(body?.companySlug || "").trim();
    const companyId = String(body?.companyId || "").trim();
    const jobTitle = String(body?.jobTitle || "").trim();
    const jobDescription = String(body?.jobDescription || "").trim();
    const interviewContext = String(body?.interviewContext || "").trim();
    const questionCount = clampQuestionCount(body?.questionCount);

    if (!companySlug) {
      return NextResponse.json({ error: "Slug da empresa e obrigatorio" }, { status: 400 });
    }

    if (!jobTitle) {
      return NextResponse.json({ error: "Titulo da vaga e obrigatorio" }, { status: 400 });
    }

    const membership = await getCompanyMembershipBySlug(session.userId, companySlug);
    if (!membership) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissoes" }, { status: 403 });
    }

    if (membership.company.plan === "free") {
      return NextResponse.json(
        { error: "O plano Free nao inclui geracao de perguntas por IA." },
        { status: 403 },
      );
    }

    if (companyId && membership.company.id !== companyId) {
      return NextResponse.json({ error: "companyId invalido para este utilizador" }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY nao configurada" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Es um recrutador senior. Gera perguntas totalmente personalizadas ao contexto da vaga, sem usar templates genericos. Responde sempre em JSON valido no formato: {\"questions\":[{\"question\":\"...\"}]}",
        },
        {
          role: "user",
          content: `Company ID: ${membership.company.id}
Company name: ${membership.company.name}
Company description: ${membership.company.description || "N/A"}
Job title: ${jobTitle}
Job description: ${jobDescription || "N/A"}
Additional context: ${interviewContext || "N/A"}
Question count: ${questionCount}

Requisitos:
- Perguntas em Portugues de Portugal.
- Perguntas especificas para a vaga e para o contexto da empresa.
- Misturar perguntas tecnicas, comportamentais e de resolucao de problemas.
- Evitar perguntas repetidas.
- Evitar perguntas vagas e genericas (ex: "fala sobre ti").
- Cada pergunta deve referir responsabilidades, stack, senioridade ou contexto do role quando essa informacao existir.
- Cada pergunta com no maximo 180 caracteres.
- Devolver exatamente ${questionCount} perguntas.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let questions: Array<{ question: string }> = [];

    try {
      const parsed = JSON.parse(raw);
      questions = normalizeGeneratedQuestions(parsed?.questions, questionCount);
    } catch {
      questions = normalizeQuestionsFromText(raw, questionCount);
    }

    if (questions.length < questionCount) {
      return NextResponse.json(
        { error: "A IA nao devolveu perguntas suficientes. Tenta novamente." },
        { status: 502 },
      );
    }

    return NextResponse.json({ questions: questions.slice(0, questionCount), source: "openai" });
  } catch (error) {
    console.error("Erro ao gerar perguntas com IA:", error);
    return NextResponse.json(
      { error: "Erro ao gerar perguntas com IA" },
      { status: 500 },
    );
  }
}
