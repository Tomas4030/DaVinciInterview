"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PRICING_PLANS } from "@/lib/pricing-plans";
import { tLanding, tLandingObject } from "@/lib/i18n/landing";

type PricingSectionProps = {
  compact?: boolean;
  locale?: string;
};

const supportedLocales = new Set(["pt", "en"]);

function withLocale(path: string, locale: string): string {
  const safeLocale = supportedLocales.has(locale) ? locale : "pt";
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default function PricingSection({
  compact = false,
  locale = "pt",
}: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const yearlyDiscountPercent = 20;
  const customPrice = tLanding(locale, "pricing.custom");
  const annualBilling = tLanding(locale, "pricing.annualBilling");
  const monthCadence = tLanding(locale, "pricing.month");
  const yearCadence = tLanding(locale, "pricing.year");
  const plansTranslations = tLandingObject<
    Record<string, { description: string; features: string[] }>
  >(locale, "pricing.plans");

  const formattedPlans = useMemo(() => {
    return PRICING_PLANS.map((plan) => {
      const translatedPlan = plansTranslations[plan.id];

      if (!plan.monthlyPriceEur) {
        return {
          ...plan,
          displayPrice: translatedPlan ? customPrice : plan.priceLabel || customPrice,
          cadence: "",
          savingsLabel: "",
          subLabel: billingCycle === "yearly" ? annualBilling : "",
          description: translatedPlan?.description || plan.description,
          features: translatedPlan?.features || plan.features,
        };
      }

      if (billingCycle === "monthly") {
        return {
          ...plan,
          displayPrice: `${plan.monthlyPriceEur} EUR`,
          cadence: monthCadence,
          savingsLabel: "",
          subLabel: "",
          description: translatedPlan?.description || plan.description,
          features: translatedPlan?.features || plan.features,
        };
      }

      const annualWithoutDiscount = plan.monthlyPriceEur * 12;
      const annualPrice = annualWithoutDiscount * (1 - yearlyDiscountPercent / 100);
      const monthlyEquivalent = annualPrice / 12;

      return {
        ...plan,
        displayPrice: `${Math.round(annualPrice)} EUR`,
        cadence: yearCadence,
        savingsLabel: tLanding(locale, "pricing.save", {
          percent: yearlyDiscountPercent,
        }),
        subLabel: tLanding(locale, "pricing.monthlyEquivalent", {
          value: Math.round(monthlyEquivalent),
        }),
        description: translatedPlan?.description || plan.description,
        features: translatedPlan?.features || plan.features,
      };
    });
  }, [
    annualBilling,
    billingCycle,
    customPrice,
    locale,
    monthCadence,
    plansTranslations,
    yearCadence,
  ]);

  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--c-brand)]/[0.02]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--c-brand)]">
            {tLanding(locale, "pricing.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--c-text)] md:text-4xl">
            {tLanding(locale, "pricing.title")}
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--c-text)]/60">
            {tLanding(locale, "pricing.description")}
          </p>

          <div className="mt-7 flex items-center justify-center">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={[
                  "rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold transition-colors",
                  billingCycle === "monthly"
                    ? "bg-[var(--c-bg)] text-[var(--c-text)]"
                    : "text-[var(--c-text)]/60 hover:text-[var(--c-text)]",
                ].join(" ")}
              >
                {tLanding(locale, "pricing.monthly")}
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold transition-colors",
                  billingCycle === "yearly"
                    ? "bg-[var(--c-bg)] text-[var(--c-text)]"
                    : "text-[var(--c-text)]/60 hover:text-[var(--c-text)]",
                ].join(" ")}
              >
                {tLanding(locale, "pricing.yearly")}
                <span className="rounded-full bg-[var(--c-brand)]/15 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[var(--c-brand)]">
                  -{yearlyDiscountPercent}%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {formattedPlans.map((plan) => (
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
                      {tLanding(locale, "pricing.mostPopular")}
                    </span>
                  </div>
                )}

              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/50">
                {plan.name}
              </p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-[var(--c-text)]">
                {plan.displayPrice}
              </p>
              {plan.cadence && (
                <p className="text-[0.75rem] text-[var(--c-text)]/50">
                  {plan.cadence}
                </p>
              )}
              {plan.subLabel ? (
                <p className="mt-1 text-[0.72rem] text-[var(--c-text)]/50">
                  {plan.subLabel}
                </p>
              ) : null}
              {plan.savingsLabel ? (
                <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-emerald-700">
                  {plan.savingsLabel}
                </p>
              ) : null}
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
                href={withLocale(compact ? "/pricing" : "/signup", locale)}
                className={[
                  "block w-full rounded-xl px-4 py-2.5 text-center text-[0.82rem] font-semibold transition-all",
                  plan.highlighted
                    ? "bg-[var(--c-brand)] text-white shadow-[0_2px_8px_rgba(67,85,232,0.25)] hover:bg-[var(--c-brand-dark)] hover:shadow-[0_4px_16px_rgba(67,85,232,0.3)]"
                    : "border border-[var(--c-border)] text-[var(--c-text)]/80 hover:border-[var(--c-brand)]/30 hover:text-[var(--c-brand)]",
                ].join(" ")}
              >
                {compact
                  ? tLanding(locale, "pricing.viewDetails")
                  : tLanding(locale, "pricing.startNow")}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[0.78rem] text-[var(--c-text)]/45">
          {tLanding(locale, "pricing.trial")}
        </p>
      </div>
    </section>
  );
}
