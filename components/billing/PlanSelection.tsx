"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type Props = {
  locale: string;
  userId: string;
};

type PlanId = "free" | "basic" | "pro";

const PLAN_COPY: Record<string, Record<PlanId, { title: string; price: string; features: string[] }>> = {
  pt: {
    free: {
      title: "Free",
      price: "0 EUR",
      features: [
        "1 empresa",
        "Ate 1 entrevista ativa",
        "Ate 5 perguntas por entrevista",
        "Sem geracao IA de perguntas",
      ],
    },
    basic: {
      title: "Basic",
      price: "49 EUR/mes",
      features: [
        "1 empresa",
        "Ate 5 entrevistas ativas",
        "Perguntas ilimitadas",
        "Geracao IA de perguntas",
        "Exportacao PDF",
      ],
    },
    pro: {
      title: "Pro",
      price: "149 EUR/mes",
      features: [
        "Ate 3 empresas",
        "Entrevistas ativas ilimitadas",
        "Perguntas ilimitadas",
        "Comparacao IA",
        "Prioridade no suporte",
      ],
    },
  },
  en: {
    free: {
      title: "Free",
      price: "0 EUR",
      features: [
        "1 company",
        "Up to 1 active interview",
        "Up to 5 questions per interview",
        "No AI question generation",
      ],
    },
    basic: {
      title: "Basic",
      price: "49 EUR/month",
      features: [
        "1 company",
        "Up to 5 active interviews",
        "Unlimited questions",
        "AI question generation",
        "PDF export",
      ],
    },
    pro: {
      title: "Pro",
      price: "149 EUR/month",
      features: [
        "Up to 3 companies",
        "Unlimited active interviews",
        "Unlimited questions",
        "AI comparison",
        "Priority support",
      ],
    },
  },
};

export default function PlanSelection({ locale, userId }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const safeLocale = locale === "pt" ? "pt" : "en";
  const copy = PLAN_COPY[safeLocale];

  async function selectPlan(plan: PlanId) {
    setError("");
    setLoadingPlan(plan);

    if (plan === "free") {
      router.push(`/${safeLocale}/onboarding?plan=free`);
      return;
    }

    try {
      const response = await fetch(withBasePath("/api/stripe/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          user_id: userId,
          locale: safeLocale,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Nao foi possivel iniciar checkout.");
        return;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError("Checkout indisponivel no momento.");
    } catch (requestError) {
      console.error("Erro ao selecionar plano:", requestError);
      setError("Erro de rede ao iniciar checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {(["free", "basic", "pro"] as PlanId[]).map((plan) => (
          <article key={plan} className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--c-text)]/60">
              {copy[plan].title}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{copy[plan].price}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--c-text)]/75">
              {copy[plan].features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => selectPlan(plan)}
              disabled={loadingPlan !== null}
              className="mt-4 w-full rounded-lg bg-[var(--c-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--c-brand-dark)] disabled:opacity-60"
            >
              {loadingPlan === plan ? "A processar..." : "Escolher plano"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
