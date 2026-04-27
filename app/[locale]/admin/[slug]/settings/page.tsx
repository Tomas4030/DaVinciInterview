import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AdminCompanyMembersManager,
  AdminCompanySettingsForm,
} from "@/components/admin";
import { tAdmin } from "@/lib/i18n/admin";
import { getCompanyBySlug } from "@/lib/queries/companies";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "settingsPage.metaTitle"),
  };
}

export default async function AdminCompanySettingsPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
          {tAdmin(params.locale, "settingsPage.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {tAdmin(params.locale, "settingsPage.title")}
        </h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <AdminCompanySettingsForm
          slug={company.slug}
          initialName={company.name}
          initialDescription={company.description || ""}
          initialLogoUrl={company.logo_url || ""}
          locale={params.locale}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--c-text)]">
            {tAdmin(params.locale, "members.title")}
          </h2>
          <p className="text-sm text-[var(--c-muted)]">
            {tAdmin(params.locale, "members.description")}
          </p>
        </div>

        <AdminCompanyMembersManager slug={company.slug} locale={params.locale} />
      </div>
    </section>
  );
}
