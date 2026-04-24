import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { stripInterviewMetaFromDescription } from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import InterviewsFilterBar from "@/components/admin/interviews/InterviewsFilterBar";
import InterviewListCard from "@/components/admin/interviews/InterviewListCard";

export const metadata: Metadata = { title: "Admin — Entrevistas" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams?: {
    q?: string;
    status?: string;
  };
};

const STATUS_OPTIONS = ["all", "draft", "published", "archived"] as const;

export default async function AdminCompanyInterviewsPage({
  params,
  searchParams,
}: Props) {
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

  const searchTerm = String(searchParams?.q || "")
    .trim()
    .toLowerCase();
  const rawStatus = String(searchParams?.status || "all").toLowerCase();
  const statusFilter = STATUS_OPTIONS.includes(
    rawStatus as (typeof STATUS_OPTIONS)[number],
  )
    ? rawStatus
    : "all";

  const interviews = await listInterviewsByCompany(membership.company.id);

  const filteredInterviews = interviews.filter((item) => {
    const statusMatches =
      statusFilter === "all" || item.status === statusFilter;
    if (!statusMatches) return false;

    if (!searchTerm) return true;
    return (
      item.title.toLowerCase().includes(searchTerm) ||
      stripInterviewMetaFromDescription(item.description)
        .toLowerCase()
        .includes(searchTerm)
    );
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
            Entrevistas
          </p>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            Gestao de entrevistas
          </h1>
        </div>

        <Link
          href={`/admin/${params.slug}/interviews/new`}
          className="btn-primary inline-flex px-4 py-2"
        >
          Nova entrevista
        </Link>
      </header>

      <InterviewsFilterBar searchTerm={searchTerm} statusFilter={statusFilter} />

      <div className="rounded-[12px] border border-[var(--c-border)] bg-[var(--c-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--c-border)] px-5 py-3">
          <p className="text-sm font-medium text-[var(--c-text)]">Resultados</p>
          <p className="text-xs text-[var(--c-muted)]">
            {filteredInterviews.length} entrevistas
          </p>
        </div>

        {filteredInterviews.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--c-muted)]">
            Sem resultados para os filtros selecionados.
          </p>
        ) : (
          <div className="divide-y divide-[var(--c-border)]">
            {filteredInterviews.map((item) => (
              <InterviewListCard key={item.id} slug={params.slug} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
