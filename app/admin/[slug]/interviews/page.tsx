import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin — Entrevistas" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export default function AdminCompanyInterviewsPage({ params }: Props) {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Entrevistas</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Gestao de entrevistas</h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <p className="text-sm text-[var(--c-muted)]">
          Esta area vai receber a listagem, filtros, pesquisa e criacao de entrevistas da Fase 4.3.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin" className="btn-primary inline-flex px-4 py-2">
            Abrir modulo legado
          </Link>
          <Link
            href={`/admin/${params.slug}/dashboard`}
            className="inline-flex rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm text-[var(--c-text)]"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
