import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug, type CompanyPlan } from "@/lib/queries/companies";
import { getStripeClient, resolveStripePriceId } from "@/lib/stripe";

type CheckoutBody = {
  plan?: CompanyPlan;
  user_id?: string;
  companySlug?: string;
  locale?: string;
};

function normalizePlan(value: unknown): CompanyPlan | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "free") return "free";
  if (normalized === "basic") return "basic";
  if (normalized === "pro") return "pro";
  if (normalized === "enterprise") return "enterprise";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutBody;
    const plan = normalizePlan(body?.plan);
    const userId = String(body?.user_id || "").trim();
    const companySlug = String(body?.companySlug || "").trim();
    const locale = String(body?.locale || "en").trim().toLowerCase() === "pt" ? "pt" : "en";

    if (!plan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    if (plan === "free") {
      return NextResponse.json({ error: "Plano free não usa checkout Stripe" }, { status: 400 });
    }

    if (!userId || userId !== session.userId) {
      return NextResponse.json({ error: "user_id inválido" }, { status: 403 });
    }

    let membership: Awaited<ReturnType<typeof getCompanyMembershipBySlug>> = null;
    if (companySlug) {
      membership = await getCompanyMembershipBySlug(session.userId, companySlug);
      if (!membership) {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }

      if (membership.role !== "owner" && membership.role !== "admin") {
        return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
      }
    }

    const priceId = resolveStripePriceId(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Price ID do plano não configurado" }, { status: 500 });
    }

    const appUrl =
      String(process.env.NEXT_PUBLIC_APP_URL || "").trim() || request.nextUrl.origin;

    const stripe = getStripeClient();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/${locale}/onboarding?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${appUrl}/${locale}/plans?manage=1`,
      customer: membership?.company?.stripe_customer_id || undefined,
      customer_email: undefined,
      metadata: {
        company_id: membership?.company?.id || "",
        company_slug: membership?.company?.slug || "",
        user_id: session.userId,
        plan,
      },
      subscription_data: {
        metadata: {
          company_id: membership?.company?.id || "",
          user_id: session.userId,
          plan,
        },
      },
    });

    return NextResponse.json({
      checkoutUrl: checkout.url,
      sessionId: checkout.id,
    });
  } catch (error) {
    console.error("Erro ao criar checkout Stripe:", error);
    return NextResponse.json({ error: "Erro ao criar checkout Stripe" }, { status: 500 });
  }
}
