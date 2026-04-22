import GridPattern from "@/components/home/GridPattern";
import type { CompanyRecord } from "@/lib/queries/companies";

type CompanyPublicHeroProps = {
  company: CompanyRecord;
  interviewsCount: number;
};

export default function CompanyPublicHero({
  company,
  interviewsCount,
}: CompanyPublicHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--c-border)]/60">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <GridPattern />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--c-bg)] to-transparent" />
        <div className="absolute right-1/4 top-1/3 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[var(--c-brand)]/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="max-w-4xl">
          <div className="mb-7 inline-flex animate-reveal items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--c-brand)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--c-text)]/65">
              Carreiras {company.name}
            </span>
          </div>

          <div className="mb-5 flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`Logo ${company.name}`}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--c-brand)] text-base font-semibold text-white">
                {company.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <h1 className="text-balance font-display text-[2.1rem] leading-[1.08] tracking-[-0.03em] text-[var(--c-text)] md:text-[3.2rem]">
              Vagas em aberto na {company.name}
            </h1>
          </div>

          <p className="max-w-2xl text-[1rem] leading-relaxed text-[var(--c-text)]/65 md:text-[1.05rem]">
            {company.description ||
              "Consulta as oportunidades abertas, candidata-te em poucos minutos e acompanha o processo de forma simples."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-[0.84rem] text-[var(--c-text)]/60">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-3 py-1.5 text-[var(--c-text)]/70">
              {interviewsCount} entrevista{interviewsCount === 1 ? "" : "s"} publicada
              {interviewsCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-3 py-1.5 text-[var(--c-text)]/70">
              Processo em 3 passos
            </span>
            <a
              href="#vagas"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-[var(--c-brand-dark)]"
            >
              Ver entrevistas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
