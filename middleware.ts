import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeBasePath } from "@/lib/base-path-utils";

export function middleware(request: NextRequest) {
  // Only apply to HTML pages — never to _next/static, _next/image, api, or public files
  const { pathname } = request.nextUrl;
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || "");
  const pathnameWithoutBasePath =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;

  // Skip internal Next.js assets and API routes
  if (
    pathnameWithoutBasePath.startsWith("/_next") ||
    pathnameWithoutBasePath.startsWith("/api") ||
    pathnameWithoutBasePath.includes(".") // static files (favicon.ico, etc.)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

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
