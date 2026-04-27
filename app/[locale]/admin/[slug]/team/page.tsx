import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCompanyMembersManager } from "@/components/admin";
import { tAdmin } from "@/lib/i18n/admin";
import { getCompanyBySlug } from "@/lib/queries/companies";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "teamPage.metaTitle"),
  };
}

export default async function AdminCompanyTeamPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.11em] text-[var(--c-muted)]">
          {tAdmin(params.locale, "teamPage.eyebrow")}
        </p>
        <h1 className="text-[1.75rem] font-semibold leading-tight text-[var(--c-text)]">
          {tAdmin(params.locale, "teamPage.title")}
        </h1>
        <p className="text-sm text-[var(--c-muted)]">
          {tAdmin(params.locale, "members.description")}
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5 sm:p-6">
        <div className="border-b border-[var(--c-border)]/70 pb-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--c-text)]">
            {tAdmin(params.locale, "members.title")}
          </h2>
        </div>

        <AdminCompanyMembersManager slug={company.slug} locale={params.locale} />
      </section>
    </section>
  );
}
