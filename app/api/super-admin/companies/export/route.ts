import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import { listCompaniesUsageSummary } from "@/lib/queries/super-admins";

function csvEscape(value: string | number): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/\"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listCompaniesUsageSummary({
    q: searchParams.get("q") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    plan: searchParams.get("plan") || "",
    minCalls: searchParams.get("minCalls")
      ? Number(searchParams.get("minCalls"))
      : undefined,
    minCostEur: searchParams.get("minCost")
      ? Number(searchParams.get("minCost"))
      : undefined,
    minTokens: searchParams.get("minTokens")
      ? Number(searchParams.get("minTokens"))
      : undefined,
    page: 1,
    pageSize: 5000,
  });

  const header = [
    "company_name",
    "company_slug",
    "plan",
    "subscription_status",
    "interviews_count",
    "total_calls",
    "total_tokens",
    "total_cost_eur",
  ];

  const lines = [header.join(",")];
  for (const row of result.rows) {
    lines.push(
      [
        csvEscape(row.company_name),
        csvEscape(row.company_slug),
        csvEscape(row.plan || ""),
        csvEscape(row.subscription_status || ""),
        csvEscape(row.interviews_count),
        csvEscape(row.total_calls_30d),
        csvEscape(row.total_tokens_30d),
        csvEscape(row.total_cost_30d_eur.toFixed(6)),
      ].join(","),
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=super-admin-companies-${Date.now()}.csv`,
    },
  });
}
