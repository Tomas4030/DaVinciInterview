import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
  parseAdminToken,
} from "@/lib/admin-auth";
import {
  createCompanyWithOwner,
  isSlugAvailable,
  listUserCompanies,
  type CompanyPlan,
} from "@/lib/queries/companies";
import { ensureUserByEmail } from "@/lib/queries/users";
import { slugify } from "@/lib/slug";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const canonicalUser = await ensureUserByEmail(session.email);
    const ownerUserId = canonicalUser.id;

    const existingCompanies = await listUserCompanies(ownerUserId);
    if (existingCompanies.length > 0) {
      const company = existingCompanies[0];
      return NextResponse.json(
        {
          error: "Já tens uma empresa associada",
          redirectTo: `/admin/${company.slug}/dashboard`,
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const slugInput = String(body?.slug || "").trim();
    const description = String(body?.description || "").trim() || null;
    const logoUrl = String(body?.logoUrl || "").trim() || null;
    const rawPlan = String(body?.plan || "basic").trim().toLowerCase();
    const plan: CompanyPlan =
      rawPlan === "free" || rawPlan === "basic" || rawPlan === "pro" || rawPlan === "enterprise"
        ? (rawPlan as CompanyPlan)
        : "basic";

    if (!name) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 },
      );
    }

    const slug = slugify(slugInput || name);
    const available = await isSlugAvailable(slug);
    if (!available) {
      return NextResponse.json(
        { error: "Este slug já está em uso" },
        { status: 409 },
      );
    }

    if (logoUrl && !isValidHttpUrl(logoUrl)) {
      return NextResponse.json(
        { error: "URL do logo inválida. Usa http:// ou https://" },
        { status: 400 },
      );
    }

    const company = await createCompanyWithOwner({
      ownerId: ownerUserId,
      name,
      slug,
      description,
      logoUrl,
      plan,
    });

    const response = NextResponse.json({
      success: true,
      company,
      redirectTo: `/admin/${company.slug}/dashboard`,
    });

    response.cookies.set(ADMIN_COMPANY_COOKIE, company.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    });

    if (ownerUserId !== session.userId) {
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        createAdminToken(canonicalUser.email, ownerUserId),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: getSessionMaxAgeSeconds(),
        },
      );
    }

    return response;
  } catch (error) {
    console.error("Erro no onboarding da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 },
    );
  }
}
