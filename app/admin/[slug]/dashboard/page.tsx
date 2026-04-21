import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import { query } from "@/lib/db";

export const metadata: Metadata = { title: "Admin — Dashboard" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default async function AdminCompanyDashboardPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    notFound();
  }

  const membership = await getCompanyMembershipBySlug(
    session.userId,
    params.slug,
  );
  if (!membership) {
    notFound();
  }

  const interviews = await listInterviewsByCompany(membership.company.id);
  const [responseRows] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM candidato_respostas WHERE company_id = ?`,
    [membership.company.id],
  );
  const [completionRows] = await query<{ completed: number }>(
    `SELECT COUNT(*) as completed FROM candidato_respostas WHERE company_id = ? AND status = 'concluida'`,
    [membership.company.id],
  );
  const [createdWindowRows] = await query<{
    week_count: number;
    month_count: number;
  }>(
    `
    SELECT
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week_count,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month_count
    FROM interviews
    WHERE company_id = ?
    `,
    [membership.company.id],
  );

  const totalResponses = Number(responseRows[0]?.total || 0);
  const totalCompleted = Number(completionRows[0]?.completed || 0);
  const totalPublished = interviews.filter(
    (item) => item.status === "published",
  ).length;
  const interviewsWeek = Number(createdWindowRows[0]?.week_count || 0);
  const interviewsMonth = Number(createdWindowRows[0]?.month_count || 0);
  const completionRate =
    totalResponses > 0
      ? Math.round((totalCompleted / totalResponses) * 100)
      : 0;
  const recentInterviews = interviews.slice(0, 5);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
          Empresa
        </p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {membership.company.name}
        </h1>
        <p className="text-sm text-[var(--c-muted)]">Role: {membership.role}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Entrevistas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">
            {interviews.length}
          </p>
          <p className="mt-1 text-xs text-[var(--c-muted)]">
            {interviewsWeek} na semana, {interviewsMonth} no mês
          </p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Publicadas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">
            {totalPublished}
          </p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Respostas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">
            {totalResponses}
          </p>
          <p className="mt-1 text-xs text-[var(--c-muted)]">
            Taxa de conclusão: {completionRate}%
          </p>
        </article>
      </div>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--c-text)]">
            Entrevistas recentes
          </h2>
          <Link
            href={`/admin/${params.slug}/interviews`}
            className="text-xs text-[var(--c-muted)] hover:text-[var(--c-text)]"
          >
            Ver todas
          </Link>
        </div>

        {recentInterviews.length === 0 ? (
          <p className="text-sm text-[var(--c-muted)]">
            Sem entrevistas criadas nesta empresa.
          </p>
        ) : (
          <div className="divide-y divide-[var(--c-border)]/50">
            {recentInterviews.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--c-text)]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--c-muted)]">
                    status: {item.status}
                  </p>
                </div>

                <Link
                  href={`/admin/${params.slug}/responses?interviewId=${item.id}`}
                  className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
                >
                  Ver respostas
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <p className="text-sm text-[var(--c-muted)]">
          A estrutura base da Fase 4 esta ativa. As paginas de entrevistas,
          respostas, definicoes e faturacao ja estao acessiveis com placeholders
          para evolucao.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/${params.slug}/interviews`}
            className="btn-primary inline-flex px-4 py-2"
          >
            Gerir entrevistas
          </Link>
          <Link
            href={`/admin/${params.slug}/responses`}
            className="inline-flex rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm text-[var(--c-text)]"
          >
            Ver respostas
          </Link>
        </div>
      </div>
    </section>
  );
}
