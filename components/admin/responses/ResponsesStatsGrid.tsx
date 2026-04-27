import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  totalConcluidas: number;
  totalAnalise: number;
  totalProgresso: number;
  locale?: string;
};

export default function ResponsesStatsGrid({
  totalConcluidas,
  totalAnalise,
  totalProgresso,
  locale = "en",
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.stats.completed")}
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalConcluidas}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.stats.inAnalysis")}
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalAnalise}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.stats.inProgress")}
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalProgresso}
        </p>
      </article>
    </div>
  );
}
