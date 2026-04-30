import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  SUPER_ADMIN_SESSION_COOKIE,
  parseSuperAdminToken,
} from "@/lib/super-admin-auth";

export type SuperAdminSession = {
  superAdminId: string;
  email: string;
  role: "super_admin";
};

export function getSuperAdminSessionFromRequest(
  request: NextRequest,
): SuperAdminSession | null {
  const token = request.cookies.get(SUPER_ADMIN_SESSION_COOKIE)?.value;
  const session = parseSuperAdminToken(token);
  if (!session) return null;

  return {
    superAdminId: session.superAdminId,
    email: session.email,
    role: session.role,
  };
}

export function getSuperAdminSessionFromServerCookies(): SuperAdminSession | null {
  const token = cookies().get(SUPER_ADMIN_SESSION_COOKIE)?.value;
  const session = parseSuperAdminToken(token);
  if (!session) return null;

  return {
    superAdminId: session.superAdminId,
    email: session.email,
    role: session.role,
  };
}
