import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  DashboardQuickActions,
  DashboardStats,
  RecentInterviewsPanel,
} from "@/components/admin/company-dashboard";
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

      <DashboardStats
        interviewsTotal={interviews.length}
        interviewsWeek={interviewsWeek}
        interviewsMonth={interviewsMonth}
        publishedTotal={totalPublished}
        responsesTotal={totalResponses}
        completionRate={completionRate}
      />

      <RecentInterviewsPanel slug={params.slug} interviews={recentInterviews} />

      <DashboardQuickActions slug={params.slug} />
    </section>
  );
}
