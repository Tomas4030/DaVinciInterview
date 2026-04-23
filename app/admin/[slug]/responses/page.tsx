import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import ResponsesFilters from "@/components/admin/ResponsesFilters";

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
  sessao_id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  interview_id: string;
  interview_title: string | null;
};

function getStatusBadgeClass(status: string): string {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "concluida") {
    return "border-[#EDF3EC] bg-[#EDF3EC] text-[#346538]";
  }
  if (normalized === "em_analise") {
    return "border-[#E1F3FE] bg-[#E1F3FE] text-[#1F6C9F]";
  }
  if (normalized === "rejeitada") {
    return "border-[#FDEBEC] bg-[#FDEBEC] text-[#9F2F2D]";
  }

  return "border-[#FBF3DB] bg-[#FBF3DB] text-[#956400]";
}

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
      cr.sessao_id,
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

  const totalConcluidas = rows.filter((row) => row.status === "concluida").length;
  const totalAnalise = rows.filter((row) => row.status === "em_analise").length;
  const totalProgresso = rows.filter((row) => row.status === "em_progresso").length;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Respostas</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Sessoes de candidatos</h1>
        <p className="max-w-3xl text-sm text-[var(--c-muted)]">
          Consulta as respostas por entrevista e abre a analise global por vaga para comparar candidatos com apoio de IA.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">Concluidas</p>
          <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">{totalConcluidas}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">Em analise</p>
          <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">{totalAnalise}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--c-muted)]">Em progresso</p>
          <p className="mt-1 text-xl font-semibold text-[var(--c-text)]">{totalProgresso}</p>
        </article>
      </div>

      <ResponsesFilters slug={params.slug} interviews={interviews} />

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
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.05em] ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--c-muted)]">
                      {new Date(row.created_at).toLocaleString("pt-PT")}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/${params.slug}/responses/${row.sessao_id}`}
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
    </section>
  );
}
