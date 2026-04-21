import Link from "next/link";
import { PRICING_PLANS } from "@/lib/pricing-plans";

type PricingSectionProps = {
  compact?: boolean;
};

export default function PricingSection({ compact = false }: PricingSectionProps) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-[var(--c-brand)]">
          Planos
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--c-text)]">
          Escolhe o plano ideal para a tua equipa
        </h2>
        <p className="mt-3 text-sm text-[var(--c-text)]/65">
          Comeca com um plano base e evolui sem migracoes complexas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.id}
            className={[
              "rounded-2xl border p-5 bg-[var(--c-surface)]",
              plan.highlighted
                ? "border-[var(--c-brand)]/40 shadow-[0_10px_28px_rgba(67,85,232,0.18)]"
                : "border-[var(--c-border)]/70",
            ].join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--c-muted)]">
              {plan.name}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{plan.priceLabel}</p>
            {plan.cadence ? <p className="text-xs text-[var(--c-muted)]">{plan.cadence}</p> : null}
            <p className="mt-3 text-sm text-[var(--c-text)]/65">{plan.description}</p>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-xs text-[var(--c-text)]/75">
                  - {feature}
                </li>
              ))}
            </ul>

            <Link
              href={compact ? "/pricing" : "/signup"}
              className="mt-5 inline-flex rounded-xl bg-[var(--c-brand)] px-4 py-2 text-xs font-semibold text-white"
            >
              {compact ? "Ver detalhes" : "Comecar"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
