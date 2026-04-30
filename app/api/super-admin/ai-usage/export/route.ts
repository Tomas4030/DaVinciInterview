import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import { listAiUsageLogs } from "@/lib/queries/super-admins";

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
  const result = await listAiUsageLogs({
    companyId: searchParams.get("companyId") || "",
    model: searchParams.get("model") || "",
    feature: searchParams.get("feature") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    q: searchParams.get("q") || "",
    page: 1,
    pageSize: 5000,
  });

  const header = [
    "created_at",
    "company_name",
    "feature",
    "model",
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "cost_eur",
  ];

  const lines = [header.join(",")];
  for (const row of result.rows) {
    lines.push(
      [
        csvEscape(row.created_at),
        csvEscape(row.company_name || ""),
        csvEscape(row.feature),
        csvEscape(row.model),
        csvEscape(row.prompt_tokens),
        csvEscape(row.completion_tokens),
        csvEscape(row.total_tokens),
        csvEscape(row.cost_eur.toFixed(6)),
      ].join(","),
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=super-admin-ai-usage-${Date.now()}.csv`,
    },
  });
}
