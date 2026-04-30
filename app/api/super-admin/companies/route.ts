import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import { listCompaniesUsageSummary } from "@/lib/queries/super-admins";

export async function GET(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await listCompaniesUsageSummary();
  return NextResponse.json({ companies });
}
