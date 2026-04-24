type Props = {
  totalConcluidas: number;
  totalAnalise: number;
  totalProgresso: number;
};

export default function ResponsesStatsGrid({
  totalConcluidas,
  totalAnalise,
  totalProgresso,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Concluidas
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalConcluidas}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Em analise
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalAnalise}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Em progresso
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">
          {totalProgresso}
        </p>
      </article>
    </div>
  );
}
