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

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  const interviews = await listInterviewsByCompany(membership.company.id);
  const [responseRows] = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM candidato_respostas WHERE company_id = ?`,
    [membership.company.id],
  );

  const totalResponses = Number(responseRows[0]?.total || 0);
  const totalPublished = interviews.filter((item) => item.status === "published").length;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Empresa</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">{membership.company.name}</h1>
        <p className="text-sm text-[var(--c-muted)]">Role: {membership.role}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Entrevistas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{interviews.length}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Publicadas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{totalPublished}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Respostas</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{totalResponses}</p>
        </article>
      </div>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <p className="text-sm text-[var(--c-muted)]">
          A estrutura base da Fase 4 esta ativa. As paginas de entrevistas, respostas,
          definicoes e faturacao ja estao acessiveis com placeholders para evolucao.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/admin/${params.slug}/interviews`} className="btn-primary inline-flex px-4 py-2">
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
