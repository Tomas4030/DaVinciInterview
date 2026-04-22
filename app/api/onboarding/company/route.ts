import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  getSessionMaxAgeSeconds,
  parseAdminToken,
} from "@/lib/admin-auth";
import {
  createCompanyWithOwner,
  isSlugAvailable,
  listUserCompanies,
} from "@/lib/queries/companies";
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

    const existingCompanies = await listUserCompanies(session.userId);
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
      ownerId: session.userId,
      name,
      slug,
      description,
      logoUrl,
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

    return response;
  } catch (error) {
    console.error("Erro no onboarding da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 },
    );
  }
}
