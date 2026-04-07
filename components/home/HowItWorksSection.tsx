import { HOW_IT_WORKS } from "./config";

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-[var(--c-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-16">
          <h2 className="text-[1.15rem] font-semibold tracking-tight text-[var(--c-text)]">
            Como funciona
          </h2>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--c-text)]/60">
            Três passos simples. Sem burocracia, sem complicação.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.num}
              className="group relative animate-reveal"
              style={{ animationDelay: `${i * 120 + 150}ms` }}
            >
              {i < HOW_IT_WORKS.length - 1 && (
                <div
                  className="absolute right-0 top-[42px] hidden w-4 border-t border-dashed border-[var(--c-border)] md:block md:-right-4 md:w-8"
                  aria-hidden="true"
                />
              )}

              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--c-brand)]/8 text-[0.82rem] font-bold text-[var(--c-brand)] ring-1 ring-[var(--c-brand)]/15 transition-colors duration-300 group-hover:bg-[var(--c-brand)]/12 group-hover:text-[var(--c-brand-dark)]">
                  {item.num}
                </span>
                <div>
                  <h3 className="text-[0.88rem] font-semibold tracking-tight text-[var(--c-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[0.815rem] leading-relaxed text-[var(--c-text)]/60">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
