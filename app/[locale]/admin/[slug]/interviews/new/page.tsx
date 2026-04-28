import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdminInterviewForm } from "@/components/admin";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tAdmin } from "@/lib/i18n/admin";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "interviewsNewPage.metaTitle"),
  };
}

export default async function AdminCompanyInterviewNewPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) notFound();

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) notFound();

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
          {tAdmin(params.locale, "interviewsNewPage.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {tAdmin(params.locale, "interviewsNewPage.title")}
        </h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <AdminInterviewForm
          slug={params.slug}
          mode="create"
          locale={params.locale}
          companyPlan={membership.company.plan}
        />
      </div>
    </section>
  );
}
