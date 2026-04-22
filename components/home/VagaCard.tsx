import Link from "next/link";
import { ArrowUpRight } from "../ui/Icons";
import { MODALIDADE_CONFIG, MODALIDADE_FALLBACK } from "./config";
import type { VagaResumo } from "@/lib/api";

export default function VagaCard({
  vaga,
  index,
}: {
  vaga: VagaResumo;
  index: number;
}) {
  const { badge, dot, Icon } =
    MODALIDADE_CONFIG[vaga.modalidade] ?? MODALIDADE_FALLBACK;

  return (
    <article
      className="group relative flex flex-col rounded-[14px] border border-[var(--c-border)]/80 bg-[var(--c-surface)] p-5
                 transition-[transform,box-shadow,border-color] duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                 hover:-translate-y-[3px] hover:border-[var(--c-brand)]/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
                 animate-reveal"
      style={{ animationDelay: `${100 + index * 80}ms` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[14px] bg-gradient-to-r from-[var(--c-brand)]/60 via-[var(--c-brand)]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <Icon />
          {vaga.modalidade}
        </span>

        <span className="text-[11px] tabular-nums text-[var(--c-text)]/50">
          {vaga.duracao_min} min
        </span>
      </div>

      <div className="flex-1 space-y-2">
        <h2 className="text-[1.05rem] font-semibold leading-[1.35] tracking-[-0.015em] text-[var(--c-text)] transition-colors duration-200 group-hover:text-[var(--c-brand)]">
          {vaga.titulo}
        </h2>

        {vaga.descricao ? (
          <p className="line-clamp-2 text-[0.815rem] leading-relaxed text-[var(--c-text)]/60">
            {vaga.descricao}
          </p>
        ) : (
          <p className="text-[0.815rem] italic leading-relaxed text-[var(--c-text)]/40">
            Sem descrição disponível.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--c-border)]/60 pt-3.5">
        <span className="text-[11px] text-[var(--c-text)]/50">
          {vaga.total_perguntas}{" "}
          {vaga.total_perguntas === 1 ? "pergunta" : "perguntas"}
        </span>

        <Link
          href={`/entrevista/${vaga.id}`}
          aria-label={`Iniciar entrevista: ${vaga.titulo}`}
          className="group/link inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--c-text)]/50 transition-colors duration-200 hover:text-[var(--c-brand)]"
        >
          Iniciar
          <span className="transition-transform duration-200 group-hover/link:translate-x-[2px] group-hover/link:-translate-y-[2px]">
            <ArrowUpRight />
          </span>
        </Link>
      </div>
    </article>
  );
}
