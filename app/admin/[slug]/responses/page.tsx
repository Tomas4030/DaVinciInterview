import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";

export const metadata: Metadata = { title: "Admin — Respostas" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams?: {
    q?: string;
    status?: string;
    interviewId?: string;
  };
};

type ResponseRow = {
  id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  interview_id: string;
  interview_title: string | null;
};

export default async function AdminCompanyResponsesPage({
  params,
  searchParams,
}: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    notFound();
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  const interviews = await listInterviewsByCompany(membership.company.id);
  const searchTerm = String(searchParams?.q || "").trim();
  const statusFilter = String(searchParams?.status || "all").trim().toLowerCase();
  const interviewFilter = String(searchParams?.interviewId || "all").trim();

  const conditions: string[] = ["cr.company_id = ?"];
  const values: string[] = [membership.company.id];

  if (statusFilter && statusFilter !== "all") {
    conditions.push("cr.status = ?");
    values.push(statusFilter);
  }

  if (interviewFilter && interviewFilter !== "all") {
    conditions.push("cr.interview_id = ?");
    values.push(interviewFilter);
  }

  if (searchTerm) {
    conditions.push("(cr.email LIKE ? OR cr.telefone LIKE ? OR i.title LIKE ?)");
    const likeTerm = `%${searchTerm}%`;
    values.push(likeTerm, likeTerm, likeTerm);
  }

  const [rows] = await query<ResponseRow>(
    `
    SELECT
      cr.id,
      cr.email,
      cr.telefone,
      cr.status,
      cr.criada_em AS created_at,
      cr.interview_id,
      i.title AS interview_title
    FROM candidato_respostas cr
    LEFT JOIN interviews i ON i.id = cr.interview_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY cr.criada_em DESC
    LIMIT 200
    `,
    values,
  );

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Respostas</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Sessoes de candidatos</h1>
      </header>

      <form className="grid gap-3 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4 md:grid-cols-[1fr,180px,220px,auto]">
        <input
          type="text"
          name="q"
          defaultValue={searchTerm}
          placeholder="Pesquisar por candidato, telefone ou entrevista"
          className="input-base"
        />

        <select name="status" defaultValue={statusFilter || "all"} className="input-base">
          <option value="all">Todos os estados</option>
          <option value="em_progresso">Em progresso</option>
          <option value="concluida">Concluida</option>
          <option value="em_analise">Em analise</option>
          <option value="rejeitada">Rejeitada</option>
        </select>

        <select name="interviewId" defaultValue={interviewFilter || "all"} className="input-base">
          <option value="all">Todas as entrevistas</option>
          {interviews.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <button type="submit" className="btn-primary inline-flex justify-center px-4 py-2">
          Filtrar
        </button>
      </form>

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
                      <span className="rounded-full border border-[var(--c-border)] px-2.5 py-1 text-xs text-[var(--c-muted)]">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--c-muted)]">
                      {new Date(row.created_at).toLocaleString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
