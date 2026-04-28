import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdminInterviewForm } from "@/components/admin";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tAdmin } from "@/lib/i18n/admin";
import {
  normalizeInterviewCardTheme,
  extractInterviewCardEmojiFromDescription,
  extractInterviewCardThemeFromDescription,
  extractInterviewContextFromDescription,
  extractInterviewEmploymentTypeFromDescription,
  extractInterviewExperienceLevelFromDescription,
  extractInterviewWorkModeFromDescription,
  normalizeInterviewEmploymentType,
  stripInterviewMetaFromDescription,
} from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { getInterviewByIdAndCompany } from "@/lib/queries/interviews";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string; id: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "interviewsEditPage.metaTitle"),
  };
}

function questionsToText(questions: any[]): string {
  return questions
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item?.question === "string") return item.question;
      if (typeof item?.texto === "string") return item.texto;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export default async function AdminCompanyInterviewEditPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    notFound();
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  const interview = await getInterviewByIdAndCompany(params.id, membership.company.id);
  if (!interview) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
          {tAdmin(params.locale, "interviewsEditPage.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {tAdmin(params.locale, "interviewsEditPage.title")}
        </h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <AdminInterviewForm
          slug={params.slug}
          mode="edit"
          interviewId={interview.id}
          initialTitle={interview.title}
          initialDescription={stripInterviewMetaFromDescription(interview.description)}
          initialInterviewContext={extractInterviewContextFromDescription(
            interview.description,
          )}
          initialEmploymentType={
            interview.employment_type && interview.employment_type !== "unspecified"
              ? normalizeInterviewEmploymentType(interview.employment_type)
              : extractInterviewEmploymentTypeFromDescription(interview.description)
          }
          initialWorkMode={
            interview.work_mode ||
            extractInterviewWorkModeFromDescription(interview.description)
          }
          initialExperienceLevel={extractInterviewExperienceLevelFromDescription(
            interview.experience_level || interview.description,
          )}
          initialCardEmoji={
            String(interview.card_emoji || "").trim() ||
            extractInterviewCardEmojiFromDescription(interview.description)
          }
          initialCardTheme={
            interview.card_theme
              ? normalizeInterviewCardTheme(interview.card_theme)
              : extractInterviewCardThemeFromDescription(interview.description)
          }
          initialStatus={interview.status}
          initialQuestionsText={questionsToText(interview.questions)}
          companyPlan={membership.company.plan}
          locale={params.locale}
        />
      </div>
    </section>
  );
}
