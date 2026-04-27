import Link from "next/link";
import type { InterviewRecord } from "@/lib/queries/interviews";
import { stripInterviewMetaFromDescription } from "@/lib/interview-meta";
import { tAdmin } from "@/lib/i18n/admin";
import DeleteInterviewButton from "../DeleteInterviewButton";
import InterviewStatusBadge from "./InterviewStatusBadge";

type Props = {
  slug: string;
  item: InterviewRecord;
  locale?: string;
};

export default function InterviewListCard({ slug, item, locale = "en" }: Props) {
  return (
    <article className="space-y-4 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--c-text)]">{item.title}</h2>
        <InterviewStatusBadge status={item.status} locale={locale} />
      </div>

      <p className="text-sm text-[var(--c-muted)]">
        {stripInterviewMetaFromDescription(item.description) ||
          tAdmin(locale, "interviews.listCard.noDescription")}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--c-muted)]">
        <span>
          {tAdmin(
            locale,
            item.questions.length === 1
              ? "interviews.listCard.questionSingular"
              : "interviews.listCard.questionPlural",
            { count: item.questions.length },
          )}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/admin/${slug}/responses?interviewId=${item.id}`}
            className="rounded-md border border-[var(--c-brand)]/30 bg-[var(--c-brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--c-brand-dark)] transition-colors hover:brightness-[0.98]"
          >
            {tAdmin(locale, "interviews.listCard.viewResponses")}
          </Link>

          <Link
            href={`/${locale}/admin/${slug}/interviews/${item.id}/edit`}
            className="rounded-md border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--c-text)] transition-colors hover:brightness-[0.98]"
          >
            {tAdmin(locale, "interviews.listCard.edit")}
          </Link>

          <DeleteInterviewButton slug={slug} interviewId={item.id} locale={locale} />

          {item.legacy_vaga_id ? (
            <Link
              href={`/admin/entrevistas/${item.legacy_vaga_id}`}
              className="rounded-md border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--c-muted)] transition-colors hover:bg-[var(--c-bg)]"
            >
              {tAdmin(locale, "interviews.listCard.editLegacy")}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
