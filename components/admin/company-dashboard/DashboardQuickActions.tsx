import Link from "next/link";

type DashboardQuickActionsProps = {
  slug: string;
};

export default function DashboardQuickActions({ slug }: DashboardQuickActionsProps) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
      <p className="text-sm text-[var(--c-muted)]">
        A estrutura base da Fase 4 esta ativa. As paginas de entrevistas, respostas,
        definicoes e faturacao ja estao acessiveis com placeholders para evolucao.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/admin/${slug}/interviews`} className="btn-primary inline-flex px-4 py-2">
          Gerir entrevistas
        </Link>
        <Link
          href={`/admin/${slug}/responses`}
          className="inline-flex rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm text-[var(--c-text)]"
        >
          Ver respostas
        </Link>
      </div>
    </div>
  );
}
