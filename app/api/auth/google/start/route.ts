import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";
import { normalizeLocale } from "@/lib/i18n/locales";

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

export async function GET(request: NextRequest) {
  const localeParam = String(request.nextUrl.searchParams.get("locale") || "en");
  const locale = normalizeLocale(localeParam);
  const rawNext = String(request.nextUrl.searchParams.get("next") || "").trim();
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const basePath = getBasePath();

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL(`${basePath}${withLocale("/admin/login", locale)}`, request.url),
    );
  }

  const state = createGoogleOAuthState();
  const statePayload = Buffer.from(
    JSON.stringify({ state, locale, next: safeNext }),
    "utf-8",
  ).toString("base64url");

  const redirectUri = `${request.nextUrl.origin}${basePath}/api/auth/google/callback`;
  const authorizationUrl = buildGoogleAuthorizationUrl({ redirectUri, state });

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
