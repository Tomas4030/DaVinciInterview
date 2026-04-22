import GridPattern from "@/components/home/GridPattern";
import { ChevronDown } from "@/components/ui/Icons";
import type { CompanyRecord } from "@/lib/queries/companies";

type CompanyPublicHeroProps = {
  company: CompanyRecord;
  interviewsCount: number;
};

export default function CompanyPublicHero({
  company,
  interviewsCount,
}: CompanyPublicHeroProps) {
  const interviewsLabel =
    interviewsCount === 0
      ? "Sem entrevistas abertas neste momento"
      : `${interviewsCount} entrevista${interviewsCount === 1 ? "" : "s"} aberta${interviewsCount === 1 ? "" : "s"}`;

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <GridPattern />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--c-bg)] to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-1/4 top-1/3 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[var(--c-brand)]/[0.05] blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-[280px] w-[280px] rounded-full bg-[var(--c-brand)]/[0.03] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-36">
        <div className="max-w-3xl">
          <div className="mb-8 inline-flex animate-reveal items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--c-brand)] opacity-40 [animation-duration:1.2s]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--c-brand)]" />
            </span>

            <span className="text-[0.95rem] font-medium text-[var(--c-text)]/60">
              {interviewsLabel}
            </span>
          </div>

          <h1
            className="animate-reveal text-balance font-display text-[2.8rem] leading-[1.05] tracking-[-0.035em] text-[var(--c-text)] md:text-[4.2rem]"
            style={{ animationDelay: "80ms" }}
          >
            Constrói o teu futuro com a{" "}
            <span className="text-[var(--c-brand)]">{company.name}</span>
          </h1>

          <p
            className="mt-6 max-w-xl animate-reveal text-[1.05rem] leading-relaxed text-[var(--c-text)]/65"
            style={{ animationDelay: "160ms" }}
          >
            {company.description ||
              `Explora as oportunidades abertas na ${company.name}, responde ao teu ritmo e submete a tua candidatura em poucos minutos.`}
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 animate-reveal"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href="#vagas"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--c-brand)] px-5 py-[11px] text-[0.82rem] font-semibold text-white
                         shadow-[0_1px_2px_rgba(67,85,232,0.1),0_4px_16px_rgba(67,85,232,0.22)]
                         transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                         hover:-translate-y-[2px] hover:shadow-[0_2px_4px_rgba(67,85,232,0.1),0_8px_32px_rgba(67,85,232,0.28)]
                         active:scale-[0.985]"
            >
              Ver vagas disponíveis
              <ChevronDown />
            </a>

            <a
              href="#como-funciona"
              className="text-[0.82rem] font-medium text-[var(--c-text)]/55 transition-colors duration-150 hover:text-[var(--c-text)]"
            >
              Como funciona
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
