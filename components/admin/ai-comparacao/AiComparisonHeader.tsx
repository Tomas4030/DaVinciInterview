import Link from "next/link";
import type { VagaAnalysis } from "@/lib/ai-comparison-service";
import AiComparisonRefreshButton from "../AiComparisonRefreshButton";
import { VagaSelector } from "../company-dashboard";

type Props = {
  slug: string;
  vagas: VagaAnalysis[];
  selectedVagaId?: string;
};

export default function AiComparisonHeader({
  slug,
  vagas,
  selectedVagaId,
}: Props) {
  return (
    <header className="overflow-hidden rounded-2xl border border-[var(--c-border)]/60 bg-[var(--c-surface)] shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4F46E5"
            strokeWidth="1.8"
            className="h-4.5 w-4.5"
          >
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </div>
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[var(--c-muted)]">
            Análise IA
          </p>
          <h1 className="text-lg font-semibold leading-tight text-[var(--c-text)]">
            Comparação de candidatos por vaga
          </h1>
        </div>
      </div>

      <div className="border-t border-[var(--c-border)]/50 bg-[var(--c-bg)]/60 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">
              Vaga
            </p>
            <VagaSelector
              vagas={vagas}
              selectedVagaId={selectedVagaId}
              slug={slug}
            />
          </div>

          <div className="flex items-center gap-2">
            <AiComparisonRefreshButton slug={slug} />

            <Link
              href={`/admin/${slug}/responses`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#4338CA] active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3 w-3"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Voltar às respostas
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
