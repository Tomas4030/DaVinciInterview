import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Definicoes" };
export const dynamic = "force-dynamic";

export default function AdminCompanySettingsPage() {
  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Definicoes</p>
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">Definicoes da empresa</h1>
      </header>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <p className="text-sm text-[var(--c-muted)]">
          Placeholder da Fase 4.5 para editar nome, descricao, logo e cor primaria.
        </p>
      </div>
    </section>
  );
}
