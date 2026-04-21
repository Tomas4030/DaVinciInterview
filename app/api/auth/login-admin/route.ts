// app/api/auth/login-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { ensureUserByEmail, verifyUserCredentials } from "@/lib/queries/users";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const maxAge = getSessionMaxAgeSeconds();

    let user = await verifyUserCredentials(normalizedEmail, password);

    if (!user) {
      const isLegacyAdmin = verifyAdminCredentials(normalizedEmail, password);
      if (!isLegacyAdmin) {
        return NextResponse.json(
          { error: "Email ou senha inválidos" },
          { status: 401 },
        );
      }

      user = await ensureUserByEmail(normalizedEmail);
    }

    const token = createAdminToken(user.email, user.id);
    const company = await resolveDefaultCompanyForUser(user.id, user.email);
    const redirectTo = company
      ? `/admin/${company.slug}/dashboard`
      : "/onboarding";

    const response = NextResponse.json({
      success: true,
      token,
      redirectTo,
      admin: {
        email: user.email,
        role: "admin",
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    if (company) {
      response.cookies.set(ADMIN_COMPANY_COOKIE, company.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    } else {
      response.cookies.set(ADMIN_COMPANY_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao fazer login de admin:", error);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
