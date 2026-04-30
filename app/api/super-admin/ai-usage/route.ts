import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import { listAiUsageLogs } from "@/lib/queries/super-admins";

export async function GET(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const logs = await listAiUsageLogs({
    companyId: searchParams.get("companyId") || "",
    model: searchParams.get("model") || "",
    feature: searchParams.get("feature") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    q: searchParams.get("q") || "",
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 20),
  });

  return NextResponse.json({ logs });
}
