// app/api/auth/login-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { ensureUserByEmail } from "@/lib/queries/users";
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

    // Verificar credenciais do admin
    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 },
      );
    }

    const user = await ensureUserByEmail(email);

    const token = createAdminToken(email, user.id);

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        email,
        role: "admin",
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    const company = await resolveDefaultCompanyForUser(user.id, email);
    if (company) {
      response.cookies.set(ADMIN_COMPANY_COOKIE, company.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao fazer login de admin:", error);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
