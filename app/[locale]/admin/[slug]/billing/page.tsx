import type { Metadata } from "next";
import { tAdmin } from "@/lib/i18n/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: tAdmin(params.locale, "billingPage.metaTitle"),
  };
}

export default function AdminCompanyBillingPage({ params }: Props) {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">
          {tAdmin(params.locale, "billingPage.eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {tAdmin(params.locale, "billingPage.title")}
        </h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <p className="text-sm text-[var(--c-muted)]">
          {tAdmin(params.locale, "billingPage.description")}
        </p>
      </div>
    </section>
  );
}
