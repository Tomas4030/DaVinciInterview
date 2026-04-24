import type { Metadata } from "next";
import { AdminInterviewForm } from "@/components/admin";

export const metadata: Metadata = { title: "Admin — Nova Entrevista" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default function AdminCompanyInterviewNewPage({ params }: Props) {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Entrevistas</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Nova entrevista</h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <AdminInterviewForm slug={params.slug} mode="create" />
      </div>
    </section>
  );
}
