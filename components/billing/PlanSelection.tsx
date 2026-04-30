"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { normalizeLocale } from "@/lib/i18n/locales";
import PricingSection from "@/components/home/PricingSection";
import type { PricingPlan } from "@/lib/pricing-plans";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  locale: string;
  userId: string;
};

type PlanId = "free" | "basic" | "pro";
const PLAN_ORDER: PlanId[] = ["free", "basic", "pro"];

export default function PlanSelection({ locale, userId }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const normalizedLocale = normalizeLocale(locale);
  const safeLocale = normalizedLocale === "pt" || normalizedLocale === "br" ? "pt" : "en";

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
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <PricingSection
        locale={safeLocale}
        ctaMode="button"
        onSelectPlan={(planId) => selectPlan(planId as PricingPlan["id"])}
        loadingPlanId={loadingPlan}
      />
    </div>
  );
}
