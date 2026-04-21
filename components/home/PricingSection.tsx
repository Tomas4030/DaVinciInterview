import Link from "next/link";
import { PRICING_PLANS } from "@/lib/pricing-plans";

type PricingSectionProps = {
  compact?: boolean;
};

export default function PricingSection({
  compact = false,
}: PricingSectionProps) {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--c-brand)]/[0.02]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--c-brand)]">
            Planos
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--c-text)] md:text-4xl">
            Escolhe o plano ideal para a tua equipa
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--c-text)]/60">
            Começa com um plano base e evolui sem migrações complexas. Cancela
            quando quiseres.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={[
                "relative rounded-2xl border p-6 bg-[var(--c-surface)] transition-all duration-300 hover:-translate-y-1",
                plan.highlighted
                  ? "border-[var(--c-brand)]/40 shadow-[0_8px_32px_rgba(67,85,232,0.15)]"
                  : "border-[var(--c-border)]/70 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]",
              ].join(" ")}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[var(--c-brand)] px-3 py-1 text-[0.68rem] font-semibold text-white shadow-[0_2px_8px_rgba(67,85,232,0.3)]">
                    Mais popular
                  </span>
                </div>
              )}

              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/50">
                {plan.name}
              </p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-[var(--c-text)]">
                {plan.priceLabel}
              </p>
              {plan.cadence && (
                <p className="text-[0.75rem] text-[var(--c-text)]/50">
                  {plan.cadence}
                </p>
              )}
              <p className="mt-3 text-[0.82rem] leading-relaxed text-[var(--c-text)]/65">
                {plan.description}
              </p>

              <div className="my-5 h-px bg-[var(--c-border)]/50" />

              <ul className="mb-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-[0.82rem] text-[var(--c-text)]/75"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-brand)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={compact ? "/pricing" : "/signup"}
                className={[
                  "block w-full rounded-xl px-4 py-2.5 text-center text-[0.82rem] font-semibold transition-all",
                  plan.highlighted
                    ? "bg-[var(--c-brand)] text-white shadow-[0_2px_8px_rgba(67,85,232,0.25)] hover:bg-[var(--c-brand-dark)] hover:shadow-[0_4px_16px_rgba(67,85,232,0.3)]"
                    : "border border-[var(--c-border)] text-[var(--c-text)]/80 hover:border-[var(--c-brand)]/30 hover:text-[var(--c-brand)]",
                ].join(" ")}
              >
                {compact ? "Ver detalhes" : "Começar agora"}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[0.78rem] text-[var(--c-text)]/45">
          Todos os planos incluem 14 dias de trial gratuito. Sem cartão de
          crédito.
        </p>
      </div>
    </section>
  );
}
