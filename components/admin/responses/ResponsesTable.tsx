import Link from "next/link";
import ResponseStatusBadge from "@/components/admin/responses/ResponseStatusBadge";
import type { ResponseRow } from "@/components/admin/responses/types";

type Props = {
  slug: string;
  rows: ResponseRow[];
};

export default function ResponsesTable({ slug, rows }: Props) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--c-border)]/60 px-5 py-3">
        <p className="text-sm font-medium text-[var(--c-text)]">Resultados</p>
        <p className="text-xs text-[var(--c-muted)]">{rows.length} registos</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-sm text-[var(--c-muted)]">
          Sem respostas para os filtros selecionados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--c-border)]/40 text-xs uppercase tracking-[0.07em] text-[var(--c-muted)]">
              <tr>
                <th className="px-5 py-3 font-medium">Candidato</th>
                <th className="px-5 py-3 font-medium">Entrevista</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Ações</th>
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
                    {row.interview_title || "Entrevista sem titulo"}
                  </td>
                  <td className="px-5 py-3">
                    <ResponseStatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3 text-[var(--c-muted)]">
                    {new Date(row.created_at).toLocaleString("pt-PT")}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/${slug}/responses/${row.sessao_id}`}
                      className="inline-flex rounded-md bg-[var(--c-brand)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--c-brand-dark)]"
                    >
                      Ver respostas
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
