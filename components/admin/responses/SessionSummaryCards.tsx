import ResponseStatusBadge from "./ResponseStatusBadge";

type Props = {
  email: string;
  telefone: string;
  status: string;
  createdAt: string;
};

export default function SessionSummaryCards({
  email,
  telefone,
  status,
  createdAt,
}: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr,1fr,auto,auto]">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Candidato
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)]">{email}</p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Telemóvel
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)]">
          {telefone || "—"}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">Estado</p>
        <div className="mt-2">
          <ResponseStatusBadge status={status} />
        </div>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          Data/Hora
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)]">
          {new Date(createdAt).toLocaleString("pt-PT")}
        </p>
      </article>
    </div>
  );
}
