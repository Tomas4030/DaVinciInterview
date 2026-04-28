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
    <section className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {tAdmin(params.locale, "interviewsPage.eyebrow")}
          </p>

          <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.04em] text-slate-950">
            {tAdmin(params.locale, "interviewsPage.title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Crie, organize e acompanhe todas as entrevistas da sua empresa.
          </p>
        </div>

        <Link
          href={`/${params.locale}/admin/${params.slug}/interviews/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          {tAdmin(params.locale, "interviewsPage.newInterview")}
        </Link>
      </header>

      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.04)]">
        <InterviewsFilterBar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          locale={params.locale}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-slate-900">
            {tAdmin(params.locale, "interviewsPage.results")}
          </p>

          <p className="text-xs text-slate-400">
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
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              {tAdmin(params.locale, "interviewsPage.empty")}
            </p>
          </div>
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
