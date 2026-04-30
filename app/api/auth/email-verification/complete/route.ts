import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { verifyAuthEmailChallenge } from "@/lib/auth-email-verification";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";
import {
  createUserWithPassword,
  ensureUserByEmail,
  verifyUserCredentials,
} from "@/lib/queries/users";

function withAuthCookies(response: NextResponse, userId: string, userEmail: string, companyId?: string) {
  const token = createAdminToken(userEmail, userId);
  const maxAge = getSessionMaxAgeSeconds();

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  if (companyId) {
    response.cookies.set(ADMIN_COMPANY_COOKIE, companyId, {
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

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const challengeId = String(body?.challengeId || "").trim();
    const code = String(body?.code || "").trim();

    if (!challengeId || !code) {
      return NextResponse.json(
        { error: "Código de verificação obrigatório" },
        { status: 400 },
      );
    }

    const payload = verifyAuthEmailChallenge(challengeId, code);
    if (!payload) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    const safeNext = payload.next || "";

    if (payload.action === "signup") {
      const user = await createUserWithPassword({
        email: payload.email,
        password: payload.password,
        name: payload.name || null,
      });

      const company = await resolveDefaultCompanyForUser(user.id, user.email);
      const defaultRedirect = company ? `/admin/${company.slug}/dashboard` : "/plans";
      const redirectTo = safeNext || defaultRedirect;

      const response = NextResponse.json({
        success: true,
        redirectTo,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });

      withAuthCookies(response, user.id, user.email, company?.id);
      return response;
    }

    let user = await verifyUserCredentials(payload.email, payload.password);
    if (!user) {
      const isLegacyAdmin = verifyAdminCredentials(payload.email, payload.password);
      if (!isLegacyAdmin) {
        return NextResponse.json(
          { error: "Email ou senha inválidos" },
          { status: 401 },
        );
      }
      user = await ensureUserByEmail(payload.email);
    }

    const company = await resolveDefaultCompanyForUser(user.id, user.email);
    const defaultRedirect = company ? `/admin/${company.slug}/dashboard` : "/onboarding";
    const redirectTo = safeNext || defaultRedirect;

    const token = createAdminToken(user.email, user.id);
    const response = NextResponse.json({
      success: true,
      token,
      redirectTo,
      admin: {
        email: user.email,
        role: "admin",
      },
    });

    const maxAge = getSessionMaxAgeSeconds();
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
    console.error("[POST /api/auth/email-verification/complete]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
