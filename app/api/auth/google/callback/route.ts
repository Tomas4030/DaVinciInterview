import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminToken,
  getSessionMaxAgeSeconds,
} from "@/lib/admin-auth";
import {
  exchangeGoogleCodeForToken,
  fetchGoogleUserInfo,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";
import { normalizeLocale } from "@/lib/i18n/locales";
import { resolveDefaultCompanyForUser } from "@/lib/queries/companies";
import { ensureUserByEmailAndName } from "@/lib/queries/users";

function getBasePath(): string {
  const value = String(process.env.NEXT_PUBLIC_BASE_PATH || "").trim();
  if (!value || value === "/") return "";
  const prefixed = value.startsWith("/") ? value : `/${value}`;
  return prefixed.endsWith("/") ? prefixed.slice(0, -1) : prefixed;
}

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") return `/${safeLocale}`;
  return `/${safeLocale}${path}`;
}

function ensureLocalizedPath(path: string, locale: string): string {
  const normalized = String(path || "").trim();
  if (!normalized) return withLocale("/", locale);
  if (normalized.startsWith("/en/") || normalized === "/en") return normalized;
  if (normalized.startsWith("/pt/") || normalized === "/pt") return normalized;
  return withLocale(normalized, locale);
}

function decodeStatePayload(value: string): {
  state: string;
  locale: string;
  next: string;
} | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as {
      state?: string;
      locale?: string;
      next?: string;
    };

    const state = String(parsed.state || "").trim();
    const localeCandidate = String(parsed.locale || "en").trim();
    const locale = normalizeLocale(localeCandidate);
    const rawNext = String(parsed.next || "").trim();
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

    if (!state) return null;
    return { state, locale, next };
  } catch {
    return null;
  }
}

function loginRedirectUrl(request: NextRequest, locale: string): URL {
  const basePath = getBasePath();
  return new URL(`${basePath}${withLocale("/admin/login", locale)}`, request.url);
}

export async function GET(request: NextRequest) {
  const stateFromQuery = String(request.nextUrl.searchParams.get("state") || "").trim();
  const code = String(request.nextUrl.searchParams.get("code") || "").trim();
  const error = String(request.nextUrl.searchParams.get("error") || "").trim();
  const basePath = getBasePath();

  const stateCookie = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const decodedState = stateCookie ? decodeStatePayload(stateCookie) : null;
  const locale = decodedState?.locale || "en";
  const safeNext = decodedState?.next || "";

  const redirectToLogin = NextResponse.redirect(loginRedirectUrl(request, locale));
  redirectToLogin.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (!isGoogleOAuthConfigured()) {
    return redirectToLogin;
  }

  if (error || !decodedState || !stateFromQuery || decodedState.state !== stateFromQuery || !code) {
    return redirectToLogin;
  }

  try {
    const redirectUri = `${request.nextUrl.origin}${basePath}/api/auth/google/callback`;
    const tokenResponse = await exchangeGoogleCodeForToken({ code, redirectUri });
    const profile = await fetchGoogleUserInfo(tokenResponse.access_token);

    const email = String(profile.email || "").trim().toLowerCase();
    const isEmailVerified = Boolean(profile.email_verified);

    if (!email || !isEmailVerified) {
      return redirectToLogin;
    }

    const user = await ensureUserByEmailAndName(email, profile.name || null);
    const company = await resolveDefaultCompanyForUser(user.id, user.email);
    const token = createAdminToken(user.email, user.id);
    const maxAge = getSessionMaxAgeSeconds();
    const defaultRedirect = company ? `/admin/${company.slug}/dashboard` : "/plans";
    const redirectTo = safeNext || defaultRedirect;

    const response = NextResponse.redirect(
      new URL(`${basePath}${ensureLocalizedPath(redirectTo, locale)}`, request.url),
    );

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

    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (oauthError) {
    console.error("Erro no login Google:", oauthError);
    return redirectToLogin;
  }
}
