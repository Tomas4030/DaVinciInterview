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

function normalizeGeneratedQuestions(
  raw: unknown,
  maxCount: number,
): Array<{ question: string }> {
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

function normalizeQuestionsFromText(
  raw: string,
  maxCount: number,
): Array<{ question: string }> {
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
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateQuestionsRequest;
    const companySlug = String(body?.companySlug || "").trim();
    const companyId = String(body?.companyId || "").trim();
    const jobTitle = String(body?.jobTitle || "").trim();
    const jobDescription = String(body?.jobDescription || "").trim();
    const interviewContext = String(body?.interviewContext || "").trim();
    const questionCount = clampQuestionCount(body?.questionCount);

    if (!companySlug) {
      return NextResponse.json(
        { error: "Slug da empresa é obrigatório" },
        { status: 400 },
      );
    }

    if (!jobTitle) {
      return NextResponse.json(
        { error: "Título da vaga é obrigatório" },
        { status: 400 },
      );
    }

    const membership = await getCompanyMembershipBySlug(
      session.userId,
      companySlug,
    );
    if (!membership) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
    }

    if (membership.company.plan === "free") {
      return NextResponse.json(
        { error: "O plano Free não inclui geração de perguntas por IA." },
        { status: 403 },
      );
    }

    if (companyId && membership.company.id !== companyId) {
      return NextResponse.json(
        { error: "companyId inválido para este utilizador" },
        { status: 403 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada" },
        { status: 500 },
      );
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
          content: `You are a senior recruiter generating interview questions. You write in European Portuguese (pt-PT). Respond with valid JSON only in the format: {"questions":[{"question":"..."}]}`,
        },
        {
          role: "user",
          content: `Empresa: ${membership.company.name}
            Descrição da empresa: ${membership.company.description || "N/A"}
            Título da vaga: ${jobTitle}
            Descrição da vaga: ${jobDescription || "N/A"}
            Contexto adicional: ${interviewContext || "N/A"}
            Número de perguntas: ${questionCount}

            Gera exatamente ${questionCount} perguntas de entrevista em Português de Portugal, seguindo estas regras:

            1. As perguntas devem ser específicas para esta vaga e empresa — nunca genéricas.
            2. Mistura de tipos: técnicas (avaliar competências hard), comportamentais (avaliar soft skills e experiência passada), e situacionais (cenários hipotéticos relevantes para o dia-a-dia do cargo).
            3. Quando a descrição da vaga menciona tecnologias, responsabilidades ou senioridade específica, as perguntas devem refletir isso diretamente.
            4. Evita perguntas vagas como "Fala-me sobre ti" ou "Quais são os teus pontos fortes?".
            5. Cada pergunta tem no máximo 180 caracteres.
            6. Cada pergunta é auto-suficiente — o candidato deve perceber o que se espera sem contexto adicional.`,
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
        { error: "A IA não devolveu perguntas suficientes. Tenta novamente." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      questions: questions.slice(0, questionCount),
      source: "openai",
    });
  } catch (error) {
    console.error("Erro ao gerar perguntas com IA:", error);
    return NextResponse.json(
      { error: "Erro ao gerar perguntas com IA" },
      { status: 500 },
    );
  }
}
