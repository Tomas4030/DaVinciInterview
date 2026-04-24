import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import ResponsesFilters from "@/components/admin/ResponsesFilters";
import ResponsesStatsGrid from "@/components/admin/responses/ResponsesStatsGrid";
import ResponsesTable from "@/components/admin/responses/ResponsesTable";
import type { ResponseRow } from "@/components/admin/responses/types";

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

      <ResponsesStatsGrid
        totalConcluidas={totalConcluidas}
        totalAnalise={totalAnalise}
        totalProgresso={totalProgresso}
      />

      <ResponsesFilters slug={params.slug} interviews={interviews} />

      <ResponsesTable slug={params.slug} rows={rows} />
    </section>
  );
}
