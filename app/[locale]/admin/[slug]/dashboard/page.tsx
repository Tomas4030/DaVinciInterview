import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
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

  let membership: Awaited<ReturnType<typeof getCompanyMembershipBySlug>> = null;
  try {
    membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  } catch (error) {
    console.error("[dashboard] Falha ao carregar membership", {
      slug: params.slug,
      userId: session.userId,
      error,
    });
    notFound();
  }

  if (!membership) {
    notFound();
  }

  let interviews: Awaited<ReturnType<typeof listInterviewsByCompany>> = [];
  try {
    interviews = await listInterviewsByCompany(membership.company.id);
  } catch (error) {
    console.error("[dashboard] Falha ao listar entrevistas", {
      companyId: membership.company.id,
      error,
    });
  }
  let totalResponses = 0;
  let totalCompleted = 0;

  try {
    const [responseRows] = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM candidato_respostas WHERE company_id = ?`,
      [membership.company.id],
    );
    totalResponses = Number(responseRows[0]?.total || 0);
  } catch (error) {
    console.warn("[dashboard] Nao foi possivel contar respostas totais", error);
  }

  try {
    const [completionRows] = await query<{ completed: number }>(
      `SELECT COUNT(*) as completed FROM candidato_respostas WHERE company_id = ? AND status = 'concluida'`,
      [membership.company.id],
    );
    totalCompleted = Number(completionRows[0]?.completed || 0);
  } catch (error) {
    console.warn("[dashboard] Nao foi possivel contar respostas concluidas", error);
  }

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const interviewTimestamps = interviews
    .map((item: any) => {
      const rawDate = item?.created_at || item?.criada_em || item?.updated_at;
      const timestamp = rawDate ? new Date(rawDate).getTime() : NaN;
      return Number.isFinite(timestamp) ? timestamp : null;
    })
    .filter((timestamp): timestamp is number => timestamp !== null);

  const totalPublished = interviews.filter(
    (item) => item.status === "published",
  ).length;
  const interviewsWeek = interviewTimestamps.filter((ts) => ts >= weekAgo).length;
  const interviewsMonth = interviewTimestamps.filter((ts) => ts >= monthAgo).length;
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
    </section>
  );
}
