import Link from "next/link";
import type { InterviewRecord } from "@/lib/queries/interviews";

type CompanyInterviewsSectionProps = {
  companySlug: string;
  interviews: InterviewRecord[];
};

export default function CompanyInterviewsSection({
  companySlug,
  interviews,
}: CompanyInterviewsSectionProps) {
  return (
    <section id="vagas" className="mx-auto max-w-6xl px-6 pb-16 pt-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.2rem] font-semibold tracking-tight text-[var(--c-text)]">
            Entrevistas abertas
          </h2>
          <p className="mt-1 text-[0.84rem] text-[var(--c-text)]/55">
            Escolhe uma posicao e inicia a candidatura.
          </p>
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--c-text)]">
            Neste momento nao existem entrevistas publicadas para esta empresa.
          </p>
          <p className="mt-2 text-xs text-[var(--c-text)]/55">
            Volta mais tarde para veres novas oportunidades.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview, index) => (
            <article
              key={interview.id}
              className="group relative flex flex-col rounded-[14px] border border-[var(--c-border)]/80 bg-[var(--c-surface)] p-5 transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[3px] hover:border-[var(--c-text)]/12 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-reveal"
              style={{ animationDelay: `${90 + index * 70}ms` }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[14px] bg-gradient-to-r from-[var(--c-brand)]/70 via-[var(--c-brand)]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full border border-[var(--c-brand)]/20 bg-[var(--c-brand)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--c-brand)]">
                  Publicada
                </span>
                <span className="text-[11px] text-[var(--c-text)]/50">
                  {interview.questions.length} pergunta
                  {interview.questions.length === 1 ? "" : "s"}
                </span>
              </div>

              <h3 className="text-[1.04rem] font-semibold leading-[1.35] tracking-[-0.015em] text-[var(--c-text)]">
                {interview.title}
              </h3>

              <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-[var(--c-text)]/60">
                {interview.description || "Sem descricao para esta entrevista."}
              </p>

              <Link
                href={`/${companySlug}/interview/${interview.id}`}
                className="mt-5 inline-flex items-center justify-center rounded-md bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-[var(--c-brand-dark)] active:scale-[0.985]"
              >
                Candidatar-me agora
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
