import Link from "next/link";
import type { InterviewRecord } from "@/lib/queries/interviews";
import { tAdmin } from "@/lib/i18n/admin";

type RecentInterviewsPanelProps = {
  slug: string;
  interviews: InterviewRecord[];
  locale?: string;
};

export default function RecentInterviewsPanel({
  slug,
  interviews,
  locale = "en",
}: RecentInterviewsPanelProps) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--c-text)]">
          {tAdmin(locale, "recentInterviews.title")}
        </h2>
        <Link
          href={`/${locale}/admin/${slug}/interviews`}
          className="text-xs text-[var(--c-muted)] hover:text-[var(--c-text)]"
        >
          {tAdmin(locale, "recentInterviews.viewAll")}
        </Link>
      </div>

      {interviews.length === 0 ? (
        <p className="text-sm text-[var(--c-muted)]">
          {tAdmin(locale, "recentInterviews.empty")}
        </p>
      ) : (
        <div className="divide-y divide-[var(--c-border)]/50">
          {interviews.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[var(--c-text)]">{item.title}</p>
                <p className="text-xs text-[var(--c-muted)]">
                  {tAdmin(locale, "recentInterviews.status", {
                    status: item.status,
                  })}
                </p>
              </div>

              <Link
                href={`/${locale}/admin/${slug}/responses?interviewId=${item.id}`}
                className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
              >
                {tAdmin(locale, "recentInterviews.viewResponses")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
