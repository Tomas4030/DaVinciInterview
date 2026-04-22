type DashboardStatsProps = {
  interviewsTotal: number;
  interviewsWeek: number;
  interviewsMonth: number;
  publishedTotal: number;
  responsesTotal: number;
  completionRate: number;
};

export default function DashboardStats({
  interviewsTotal,
  interviewsWeek,
  interviewsMonth,
  publishedTotal,
  responsesTotal,
  completionRate,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">Entrevistas</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{interviewsTotal}</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">
          {interviewsWeek} na semana, {interviewsMonth} no mes
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">Publicadas</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{publishedTotal}</p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs text-[var(--c-muted)]">Respostas</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{responsesTotal}</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Taxa de conclusao: {completionRate}%</p>
      </article>
    </div>
  );
}
