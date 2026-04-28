import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getCompanyById,
  getCompanyByStripeCustomerId,
  type CompanyPlan,
  updateCompanyBillingById,
} from "@/lib/queries/companies";
import { getStripeClient, resolveStripePriceId } from "@/lib/stripe";

function planFromPriceId(priceId: string): CompanyPlan | null {
  if (priceId === resolveStripePriceId("basic")) return "basic";
  if (priceId === resolveStripePriceId("pro")) return "pro";
  if (priceId === resolveStripePriceId("enterprise")) return "enterprise";
  return null;
}

function planFromMetadata(value: unknown): CompanyPlan | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "basic") return "basic";
  if (normalized === "pro") return "pro";
  if (normalized === "enterprise") return "enterprise";
  return null;
}

async function resolveCompanyIdFromEvent(event: Stripe.Event): Promise<string | null> {
  const object = event.data.object as any;
  const metadataCompanyId = String(object?.metadata?.company_id || "").trim();
  if (metadataCompanyId) {
    const found = await getCompanyById(metadataCompanyId);
    if (found) return found.id;
  }

  const customerId = String(object?.customer || "").trim();
  if (!customerId) return null;
  const company = await getCompanyByStripeCustomerId(customerId);
  return company?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Assinatura Stripe em falta" }, { status: 400 });
    }

    const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) {
      return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET não configurada" }, { status: 500 });
    }

    const payload = await request.text();
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = await resolveCompanyIdFromEvent(event);
      const customerId = String(session.customer || "").trim() || null;

      if (companyId) {
        const plan =
          planFromMetadata(session.metadata?.plan) ||
          (session.line_items?.data?.[0]?.price?.id
            ? planFromPriceId(session.line_items.data[0].price.id)
            : null) ||
          "basic";

        await updateCompanyBillingById(companyId, {
          stripeCustomerId: customerId,
          subscriptionStatus: "active",
          plan,
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer || "").trim();
      const company = customerId ? await getCompanyByStripeCustomerId(customerId) : null;
      if (company) {
        await updateCompanyBillingById(company.id, {
          subscriptionStatus: "past_due",
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer || "").trim();
      const company = customerId ? await getCompanyByStripeCustomerId(customerId) : null;
      if (company) {
        await updateCompanyBillingById(company.id, {
          subscriptionStatus: "canceled",
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer || "").trim();
      const company = customerId ? await getCompanyByStripeCustomerId(customerId) : null;
      if (company) {
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : subscription.status === "trialing"
                ? "trialing"
                : subscription.status === "canceled"
                  ? "canceled"
                  : company.subscription_status;
        const firstPriceId = subscription.items.data[0]?.price?.id || "";
        const nextPlan = planFromPriceId(firstPriceId) || company.plan;

        await updateCompanyBillingById(company.id, {
          subscriptionStatus: status,
          plan: nextPlan,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Stripe:", error);
    return NextResponse.json({ error: "Webhook Stripe inválido" }, { status: 400 });
  }
}
