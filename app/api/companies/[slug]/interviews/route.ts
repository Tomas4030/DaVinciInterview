import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  buildInterviewDescriptionWithMeta,
  normalizeInterviewCardTheme,
  normalizeInterviewEmploymentType,
  normalizeInterviewExperienceLevel,
  normalizeInterviewWorkMode,
} from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import {
  countPublishedInterviewsByCompany,
  createInterviewForCompany,
} from "@/lib/queries/interviews";

function normalizeQuestionsFromText(raw: string): Array<{ question: string }> {
  return String(raw || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((question) => ({ question }));
}

function normalizeQuestionsFromArray(raw: unknown): Array<{ question: string }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item?.question === "string") return item.question.trim();
      return "";
    })
    .filter(Boolean)
    .map((question) => ({ question }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
    if (!membership) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body?.title || "").trim();
    const descriptionInput = String(body?.description || "").trim();
    const interviewContext = String(body?.interviewContext || "").trim();
    const workMode = normalizeInterviewWorkMode(body?.workMode);
    const employmentType = normalizeInterviewEmploymentType(body?.employmentType);
    const experienceLevel = normalizeInterviewExperienceLevel(body?.experienceLevel);
    const cardEmoji = String(body?.cardEmoji || "").trim();
    const cardTheme = normalizeInterviewCardTheme(body?.cardTheme);
    const statusRaw = String(body?.status || "draft").trim().toLowerCase();
    const questionsText = String(body?.questionsText || "");
    const questionsArray = normalizeQuestionsFromArray(body?.questions);

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const status =
      statusRaw === "published" || statusRaw === "archived" ? statusRaw : "draft";

    const maxQuestionsByPlan = membership.company.plan === "free" ? 5 : 999;
    const maxPublishedByPlan =
      membership.company.plan === "free"
        ? 1
        : membership.company.plan === "basic"
          ? 5
          : Number.POSITIVE_INFINITY;

    if (status === "published" && Number.isFinite(maxPublishedByPlan)) {
      const currentPublished = await countPublishedInterviewsByCompany(
        membership.company.id,
      );
      if (currentPublished >= maxPublishedByPlan) {
        return NextResponse.json(
          {
            error:
              membership.company.plan === "free"
                ? "Plano Free permite apenas 1 entrevista ativa/publicada."
                : "Plano Basic permite até 5 entrevistas ativas/publicadas.",
          },
          { status: 403 },
        );
      }
    }

    const normalizedQuestions = (
      questionsArray.length > 0
        ? questionsArray
        : normalizeQuestionsFromText(questionsText)
    ).slice(0, maxQuestionsByPlan);

    const interview = await createInterviewForCompany(membership.company.id, {
      title,
      description: buildInterviewDescriptionWithMeta(
        descriptionInput,
        workMode,
        employmentType,
        interviewContext,
        experienceLevel,
        cardEmoji,
        cardTheme,
      ),
      workMode,
      employmentType,
      experienceLevel,
      cardEmoji,
      cardTheme,
      status,
      questions: normalizedQuestions,
    });

    return NextResponse.json({ success: true, interview }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar entrevista:", error);
    return NextResponse.json({ error: "Erro ao criar entrevista" }, { status: 500 });
  }
}
