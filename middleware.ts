import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeBasePath } from "@/lib/base-path-utils";
import { ADMIN_COMPANY_COOKIE } from "@/lib/admin-auth-shared";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");

  const pathnameWithoutBasePath =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;

  // Fix duplicated basePath
  if (basePath) {
    const duplicatedPrefix = `${basePath}${basePath}`;
    if (
      pathname === duplicatedPrefix ||
      pathname.startsWith(`${duplicatedPrefix}/`)
    ) {
      const fixedPath = pathnameWithoutBasePath;
      const fixedUrl = request.nextUrl.clone();
      fixedUrl.pathname = fixedPath;
      return NextResponse.redirect(fixedUrl);
    }

    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = basePath;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Ignore _next, api, static files
  if (
    pathnameWithoutBasePath.startsWith("/_next") ||
    pathnameWithoutBasePath.startsWith("/api") ||
    pathnameWithoutBasePath.includes(".")
  ) {
    return NextResponse.next();
  }

  // 🌍 i18n logic
  const locales = [...SUPPORTED_LOCALES];
  const defaultLocale = DEFAULT_LOCALE;

  const hasLocale = locales.some(
    (locale) =>
      pathnameWithoutBasePath === `/${locale}` ||
      pathnameWithoutBasePath.startsWith(`/${locale}/`),
  );

  const isAdminRoute = pathnameWithoutBasePath.startsWith("/admin");

  if (isAdminRoute) {
    const localizedAdminUrl = request.nextUrl.clone();
    localizedAdminUrl.pathname =
      `${basePath}/${defaultLocale}${pathnameWithoutBasePath}`.replace(
        /\/+/g,
        "/",
      );
    return NextResponse.redirect(localizedAdminUrl);
  }

  if (!hasLocale && !isAdminRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      `${basePath}/${defaultLocale}${pathnameWithoutBasePath}`.replace(
        /\/+/g,
        "/",
      );

    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();

  // Admin cookie logic
  if (isAdminRoute || pathnameWithoutBasePath.startsWith("/api")) {
    const existingCompanyId = request.cookies.get(ADMIN_COMPANY_COOKIE)?.value;
    if (existingCompanyId) {
      response.headers.set("x-admin-company-id", existingCompanyId);
    }
  }

  // Fix login loop
  const isLocalizedAdminLogin = locales.some(
    (locale) => pathnameWithoutBasePath === `/${locale}/admin/login`,
  );

  if (isLocalizedAdminLogin) {
    const nextParam = request.nextUrl.searchParams.get("next") || "";
    const invalidNextParam =
      nextParam === "/admin/login" ||
      nextParam === "/admin/login/" ||
      locales.some(
        (locale) =>
          nextParam === `/${locale}/admin/login` ||
          nextParam === `/${locale}/admin/login/`,
      );

    if (invalidNextParam) {
      const cleanLoginUrl = request.nextUrl.clone();
      cleanLoginUrl.searchParams.delete("next");
      return NextResponse.redirect(cleanLoginUrl);
    }
  }

  // No cache
  response.headers.set(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
