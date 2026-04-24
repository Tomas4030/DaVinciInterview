import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeBasePath } from "@/lib/base-path-utils";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth-shared";
import { parseAdminTokenForMiddleware } from "@/lib/admin-auth-middleware";

export async function middleware(request: NextRequest) {
  // Only apply to HTML pages — never to _next/static, _next/image, api, or public files
  const { pathname } = request.nextUrl;
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");
  const pathnameWithoutBasePath =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;

  const applyBasePath = (targetPath: string) => {
    const normalized = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    if (!basePath) return normalized;
    if (normalized === basePath || normalized.startsWith(`${basePath}/`)) {
      return normalized;
    }
    return `${basePath}${normalized}`;
  };

  if (basePath) {
    const duplicatedPrefix = `${basePath}${basePath}`;
    if (pathname === duplicatedPrefix || pathname.startsWith(`${duplicatedPrefix}/`)) {
      const fixedPath = pathname.replace(duplicatedPrefix, basePath);
      const fixedUrl = request.nextUrl.clone();
      fixedUrl.pathname = fixedPath;
      return NextResponse.redirect(fixedUrl);
    }

    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = applyBasePath("/");
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Skip internal Next.js assets and API routes
  if (
    pathnameWithoutBasePath.startsWith("/_next") ||
    pathnameWithoutBasePath.startsWith("/api") ||
    pathnameWithoutBasePath.includes(".") // static files (favicon.ico, etc.)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await parseAdminTokenForMiddleware(adminToken);

  const isAdminLoginRoute = pathnameWithoutBasePath === "/admin/login";
  const isSignupRoute = pathnameWithoutBasePath === "/signup";
  const isOnboardingRoute = pathnameWithoutBasePath.startsWith("/onboarding");
  const isAdminRoute = pathnameWithoutBasePath.startsWith("/admin");
  const isProtectedAdminRoute = isAdminRoute && !isAdminLoginRoute;

  if (session && (isAdminLoginRoute || isSignupRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = applyBasePath("/onboarding");
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!session && (isProtectedAdminRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = applyBasePath("/admin/login");
    url.searchParams.set("next", pathnameWithoutBasePath);
    return NextResponse.redirect(url);
  }

  if (session && (isAdminRoute || pathnameWithoutBasePath.startsWith("/api"))) {
    const existingCompanyId = request.cookies.get(ADMIN_COMPANY_COOKIE)?.value;
    if (existingCompanyId) {
      response.headers.set("x-admin-company-id", existingCompanyId);
    }
  }

  const companyAdminMatch = pathnameWithoutBasePath.match(/^\/admin\/([^/]+)(?:\/(.*))?$/);
  if (session && companyAdminMatch) {
    const [, companySlug, subPathRaw] = companyAdminMatch;
    const subPath = String(subPathRaw || "").toLowerCase();

    let requiredRole = "viewer";
    if (
      subPath.startsWith("settings") ||
      subPath.startsWith("billing") ||
      subPath.includes("/edit") ||
      subPath.startsWith("interviews/new")
    ) {
      requiredRole = "admin";
    }

    const accessUrl = new URL(
      `${applyBasePath("/api/auth/company-access")}?slug=${encodeURIComponent(companySlug)}&requiredRole=${requiredRole}`,
      request.nextUrl.origin,
    );

    let accessResponse: Response | null = null;
    try {
      accessResponse = await fetch(accessUrl.toString(), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      });
    } catch (error) {
      const fallbackUrl = request.nextUrl.clone();
      fallbackUrl.pathname = applyBasePath("/admin/login");
      fallbackUrl.searchParams.set("next", pathnameWithoutBasePath);
      return NextResponse.redirect(fallbackUrl);
    }

    if (!accessResponse?.ok) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = applyBasePath("/404");
      deniedUrl.search = "";
      return NextResponse.redirect(deniedUrl);
    }
  }

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
