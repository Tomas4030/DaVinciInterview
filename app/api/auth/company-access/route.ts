import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { CompanyRole, getCompanyMembershipBySlug } from "@/lib/queries/companies";

const ROLE_LEVEL: Record<CompanyRole, number> = {
  viewer: 1,
  admin: 2,
  owner: 3,
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);

    if (!session) {
      return NextResponse.json({ allowed: false }, { status: 401 });
    }

    const slug = request.nextUrl.searchParams.get("slug") || "";
    const requiredRole =
      (request.nextUrl.searchParams.get("requiredRole") as CompanyRole | null) ||
      "viewer";

    const membership = await getCompanyMembershipBySlug(session.userId, slug);
    if (!membership) {
      return NextResponse.json({ allowed: false }, { status: 403 });
    }

    const allowed = ROLE_LEVEL[membership.role] >= ROLE_LEVEL[requiredRole];
    if (!allowed) {
      return NextResponse.json(
        {
          allowed: false,
          role: membership.role,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      allowed: true,
      role: membership.role,
      companyId: membership.company.id,
      companySlug: membership.company.slug,
    });
  } catch (error) {
    console.error("Erro ao validar acesso da empresa:", error);
    return NextResponse.json({ allowed: false }, { status: 500 });
  }
}
