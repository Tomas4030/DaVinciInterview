import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminCompanySettingsForm from "@/components/admin/AdminCompanySettingsForm";
import { getCompanyBySlug } from "@/lib/queries/companies";

export const metadata: Metadata = { title: "Admin — Definicoes" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default async function AdminCompanySettingsPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Definicoes</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Definicoes da empresa</h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <AdminCompanySettingsForm
          slug={company.slug}
          initialName={company.name}
          initialDescription={company.description || ""}
          initialLogoUrl={company.logo_url || ""}
          initialPrimaryColor={company.primary_color || "#4355e8"}
        />
      </div>
    </section>
  );
}
