import ResponseStatusBadge from "./ResponseStatusBadge";
import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  email: string;
  telefone: string;
  status: string;
  createdAt: string;
  locale?: string;
};

export default function SessionSummaryCards({
  email,
  telefone,
  status,
  createdAt,
  locale = "pt",
}: Props) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr,1fr,auto,auto]">
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.summary.candidate")}
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)]">{email}</p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.summary.phone")}
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)] max-w-[180px] truncate ">
          {telefone || "—"}
        </p>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.summary.status")}
        </p>
        <div className="mt-2">
          <ResponseStatusBadge status={status} />
        </div>
      </article>
      <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">
          {tAdmin(locale, "responses.summary.dateTime")}
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--c-text)]">
          {new Date(createdAt).toLocaleString("pt-PT")}
        </p>
      </article>
    </div>
  );
}
