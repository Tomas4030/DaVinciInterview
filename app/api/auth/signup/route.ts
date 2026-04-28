import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
} from "@/lib/admin-auth";
import {
  createUserWithPassword,
  getUserByEmail,
} from "@/lib/queries/users";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim() || null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "A password deve ter pelo menos 8 caracteres" },
        { status: 400 },
      );
    }

    const existing = await getUserByEmail(email);
    if (existing?.password_hash) {
      return NextResponse.json(
        { error: "Já existe conta com este email" },
        { status: 409 },
      );
    }

    const user = await createUserWithPassword({
      email,
      password,
      name,
    });

    const token = createAdminToken(user.email, user.id);
    const maxAge = getSessionMaxAgeSeconds();
    const company = await resolveDefaultCompanyForUser(user.id, user.email);
    const redirectTo = company
      ? `/admin/${company.slug}/dashboard`
      : "/plans";

    const response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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
    console.error("Erro ao criar conta:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 },
    );
  }
}
