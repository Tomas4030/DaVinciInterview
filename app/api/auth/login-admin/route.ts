// app/api/auth/login-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import {
  ensureUserByEmail,
  getUserByEmail,
  verifyUserCredentials,
} from "@/lib/queries/users";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export async function POST(request: NextRequest) {
  try {
    const { email, password, next } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const normalizedNext = String(next || "").trim();
    const safeNext =
      normalizedNext.startsWith("/") && !normalizedNext.startsWith("//")
        ? normalizedNext
        : "";
    const maxAge = getSessionMaxAgeSeconds();

    let user = normalizedPassword
      ? await verifyUserCredentials(normalizedEmail, normalizedPassword)
      : await getUserByEmail(normalizedEmail);

    if (!user) {
      const isLegacyAdmin = normalizedPassword
        ? verifyAdminCredentials(normalizedEmail, normalizedPassword)
        : false;
      if (!isLegacyAdmin) {
        return NextResponse.json(
          { error: "Email ou senha inválidos" },
          { status: 401 },
        );
      }

      user = await ensureUserByEmail(normalizedEmail);
    }

    const company = await resolveDefaultCompanyForUser(user.id, user.email);

    if (!normalizedPassword && !company) {
      return NextResponse.json(
        { error: "Este email não está associado a nenhuma empresa" },
        { status: 403 },
      );
    }

    const token = createAdminToken(user.email, user.id);
    const defaultRedirect = company
      ? `/admin/${company.slug}/dashboard`
      : "/onboarding";
    const redirectTo = safeNext || defaultRedirect;

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
