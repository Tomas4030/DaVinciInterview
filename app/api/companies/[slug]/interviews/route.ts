import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { normalizeInterviewWorkMode } from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { createInterviewForCompany } from "@/lib/queries/interviews";

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
    const description = String(body?.description || "").trim() || null;
    const workMode = normalizeInterviewWorkMode(body?.workMode);
    const statusRaw = String(body?.status || "draft").trim().toLowerCase();
    const questionsText = String(body?.questionsText || "");
    const questionsArray = normalizeQuestionsFromArray(body?.questions);

    if (!title) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const status =
      statusRaw === "published" || statusRaw === "archived" ? statusRaw : "draft";

    const interview = await createInterviewForCompany(membership.company.id, {
      title,
      description,
      workMode,
      status,
      questions:
        questionsArray.length > 0
          ? questionsArray
          : normalizeQuestionsFromText(questionsText),
    });

    return NextResponse.json({ success: true, interview }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar entrevista:", error);
    return NextResponse.json({ error: "Erro ao criar entrevista" }, { status: 500 });
  }
}
