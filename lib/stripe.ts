import Stripe from "stripe";
import type { CompanyPlan } from "@/lib/queries/companies";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }

  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  });
}

export function resolveStripePriceId(plan: CompanyPlan): string {
  if (plan === "basic") return String(process.env.STRIPE_PRICE_BASIC || "").trim();
  if (plan === "pro") return String(process.env.STRIPE_PRICE_PRO || "").trim();
  return String(process.env.STRIPE_PRICE_ENTERPRISE || "").trim();
}
