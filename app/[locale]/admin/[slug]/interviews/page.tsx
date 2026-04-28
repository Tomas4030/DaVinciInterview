import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tAdmin } from "@/lib/i18n/admin";
import { stripInterviewMetaFromDescription } from "@/lib/interview-meta";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";
import {
  InterviewsFilterBar,
  InterviewListCard,
} from "@/components/admin/interviews";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string };
  searchParams?: {
    q?: string;
    status?: string;
  };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "interviewsPage.metaTitle"),
  };
}

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
            {tAdmin(params.locale, "interviewsPage.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            {tAdmin(params.locale, "interviewsPage.title")}
          </h1>
        </div>

        <Link
          href={`/${params.locale}/admin/${params.slug}/interviews/new`}
          className="btn-primary inline-flex px-4 py-2"
        >
          {tAdmin(params.locale, "interviewsPage.newInterview")}
        </Link>
      </header>

      <InterviewsFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        locale={params.locale}
      />

      <div>
        <div className="mb-3 flex items-center justify-between px-1 py-1">
          <p className="text-sm font-medium text-[var(--c-text)]">
            {tAdmin(params.locale, "interviewsPage.results")}
          </p>
          <p className="text-xs text-[var(--c-muted)]">
            {filteredInterviews.length === 1
              ? tAdmin(params.locale, "interviewsPage.countSingular", {
                  count: filteredInterviews.length,
                })
              : tAdmin(params.locale, "interviewsPage.countPlural", {
                  count: filteredInterviews.length,
                })}
          </p>
        </div>

        {filteredInterviews.length === 0 ? (
          <p className="rounded-xl border border-[var(--c-border)] bg-white px-5 py-10 text-sm text-[var(--c-muted)]">
            {tAdmin(params.locale, "interviewsPage.empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((item) => (
              <InterviewListCard
                key={item.id}
                slug={params.slug}
                item={item}
                locale={params.locale}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
