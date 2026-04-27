import { tAdmin } from "@/lib/i18n/admin";

type DashboardStatsProps = {
  interviewsTotal: number;
  interviewsWeek: number;
  interviewsMonth: number;
  publishedTotal: number;
  responsesTotal: number;
  completionRate: number;
  locale?: string;
};

export default function DashboardStats({
  interviewsTotal,
  interviewsWeek,
  interviewsMonth,
  publishedTotal,
  responsesTotal,
  completionRate,
  locale = "en",
}: DashboardStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">
          {tAdmin(locale, "dashboardStats.interviews")}
        </p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{interviewsTotal}</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">
          {tAdmin(locale, "dashboardStats.period", {
            week: interviewsWeek,
            month: interviewsMonth,
          })}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">
          {tAdmin(locale, "dashboardStats.published")}
        </p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{publishedTotal}</p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">
          {tAdmin(locale, "dashboardStats.responses")}
        </p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{responsesTotal}</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">
          {tAdmin(locale, "dashboardStats.completionRate", {
            rate: completionRate,
          })}
        </p>
      </article>
    </div>
  );
}
