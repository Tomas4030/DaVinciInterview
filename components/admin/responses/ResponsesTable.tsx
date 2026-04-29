import Link from "next/link";
import { tAdmin } from "@/lib/i18n/admin";
import { normalizeLocale } from "@/lib/i18n/locales";
import ResponseStatusBadge from "./ResponseStatusBadge";
import type { ResponseRow } from "./types";

type Props = {
  slug: string;
  rows: ResponseRow[];
  locale?: string;
};

export default function ResponsesTable({ slug, rows, locale = "en" }: Props) {
  const safeLocale = normalizeLocale(locale);
  const dateLocale =
    safeLocale === "pt" || safeLocale === "br" ? "pt-BR" : safeLocale;

  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--c-border)]/60 px-5 py-3">
        <p className="text-sm font-medium text-[var(--c-text)]">
          {tAdmin(locale, "responses.table.title")}
        </p>
        <p className="text-xs text-[var(--c-muted)]">
          {tAdmin(
            locale,
            rows.length === 1
              ? "responses.table.recordsSingular"
              : "responses.table.recordsPlural",
            { count: rows.length },
          )}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-sm text-[var(--c-muted)]">
          {tAdmin(locale, "responses.table.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--c-border)]/40 text-xs uppercase tracking-[0.07em] text-[var(--c-muted)]">
              <tr>
                <th className="px-5 py-3 font-medium">
                  {tAdmin(locale, "responses.table.candidate")}
                </th>
                <th className="px-5 py-3 font-medium">
                  {tAdmin(locale, "responses.table.interview")}
                </th>
                <th className="px-5 py-3 font-medium">
                  {tAdmin(locale, "responses.table.status")}
                </th>
                <th className="px-5 py-3 font-medium">
                  {tAdmin(locale, "responses.table.date")}
                </th>
                <th className="px-5 py-3 font-medium">
                  {tAdmin(locale, "responses.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]/35">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--c-text)]">{row.email}</p>
                    <p className="text-xs text-[var(--c-muted)]">{row.telefone}</p>
                  </td>
                  <td className="px-5 py-3 text-[var(--c-text)]">
                    {row.interview_title ||
                      tAdmin(locale, "responses.table.untitledInterview")}
                  </td>
                  <td className="px-5 py-3">
                    <ResponseStatusBadge status={row.status} locale={locale} />
                  </td>
                  <td className="px-5 py-3 text-[var(--c-muted)]">
                    {new Date(row.created_at).toLocaleString(dateLocale)}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/${locale}/admin/${slug}/responses/${row.sessao_id}`}
                      className="inline-flex rounded-md bg-[var(--c-brand)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--c-brand-dark)]"
                    >
                      {tAdmin(locale, "responses.table.viewAnswers")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
