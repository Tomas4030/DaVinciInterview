import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Servico",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-[var(--c-text)]">Termos de Servico</h1>
      <p className="mt-4 text-sm text-[var(--c-text)]/70">
        Esta pagina e um placeholder inicial para os termos legais da plataforma.
      </p>
    </main>
  );
}
