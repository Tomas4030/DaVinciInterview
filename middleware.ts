import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeBasePath } from "@/lib/base-path-utils";
import { ADMIN_COMPANY_COOKIE } from "@/lib/admin-auth-shared";

export async function middleware(request: NextRequest) {
  // Only apply to HTML pages — never to _next/static, _next/image, api, or public files
  const { pathname } = request.nextUrl;
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");
  const pathnameWithoutBasePath =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;

  if (basePath) {
    const duplicatedPrefix = `${basePath}${basePath}`;
    if (pathname === duplicatedPrefix || pathname.startsWith(`${duplicatedPrefix}/`)) {
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

  // Skip internal Next.js assets and API routes
  if (
    pathnameWithoutBasePath.startsWith("/_next") ||
    pathnameWithoutBasePath.startsWith("/api") ||
    pathnameWithoutBasePath.includes(".") // static files (favicon.ico, etc.)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const isAdminRoute = pathnameWithoutBasePath.startsWith("/admin");
  if (isAdminRoute || pathnameWithoutBasePath.startsWith("/api")) {
    const existingCompanyId = request.cookies.get(ADMIN_COMPANY_COOKIE)?.value;
    if (existingCompanyId) {
      response.headers.set("x-admin-company-id", existingCompanyId);
    }
  }

  if (pathnameWithoutBasePath === "/admin/login") {
    const nextParam = request.nextUrl.searchParams.get("next") || "";
    if (nextParam === "/admin/login" || nextParam === "/admin/login/") {
      const cleanLoginUrl = request.nextUrl.clone();
      cleanLoginUrl.searchParams.delete("next");
      return NextResponse.redirect(cleanLoginUrl);
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
