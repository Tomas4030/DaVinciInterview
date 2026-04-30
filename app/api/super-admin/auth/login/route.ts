import { NextRequest, NextResponse } from "next/server";
import {
  SUPER_ADMIN_SESSION_COOKIE,
  createSuperAdminToken,
  getSuperAdminSessionMaxAgeSeconds,
  verifySuperAdminCredentials,
} from "@/lib/super-admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password são obrigatórios" }, { status: 400 });
    }

    const superAdmin = await verifySuperAdminCredentials(email, password);
    if (!superAdmin) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = createSuperAdminToken(superAdmin.email, superAdmin.id);
    const maxAge = getSuperAdminSessionMaxAgeSeconds();

    const response = NextResponse.json({
      success: true,
      redirectTo: "/super-admin",
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    });

    response.cookies.set(SUPER_ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    console.error("[POST /api/super-admin/auth/login]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
