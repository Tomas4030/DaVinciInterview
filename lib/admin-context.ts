import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  ADMIN_COMPANY_COOKIE,
  ADMIN_SESSION_COOKIE,
  parseAdminToken,
} from "@/lib/admin-auth";
import {
  CompanyRecord,
  getCompanyById,
  resolveDefaultCompanyForUser,
} from "@/lib/queries/companies";

export type AdminCompanyContext = {
  adminEmail: string;
  company: CompanyRecord;
};

async function resolveCompanyForAdmin(
  adminUserId: string,
  adminEmail: string,
  companyId?: string,
): Promise<CompanyRecord | null> {
  if (companyId) {
    const byId = await getCompanyById(companyId);
    if (byId) return byId;
  }

  return await resolveDefaultCompanyForUser(adminUserId, adminEmail);
}

export async function getAdminCompanyContextFromRequest(
  request: NextRequest,
): Promise<AdminCompanyContext | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) return null;

  const companyIdFromCookie = request.cookies.get(ADMIN_COMPANY_COOKIE)?.value;
  const companyIdFromHeader = request.headers.get("x-admin-company-id") || "";

  const company = await resolveCompanyForAdmin(
    session.userId,
    session.email,
    companyIdFromCookie || companyIdFromHeader,
  );

  if (!company) return null;

  return {
    adminEmail: session.email,
    company,
  };
}

export async function getAdminCompanyContextFromServerCookies(): Promise<AdminCompanyContext | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) return null;

  const companyIdFromCookie = cookieStore.get(ADMIN_COMPANY_COOKIE)?.value;

  const company = await resolveCompanyForAdmin(
    session.userId,
    session.email,
    companyIdFromCookie,
  );
  if (!company) return null;

  return {
    adminEmail: session.email,
    company,
  };
}
