import { NextRequest, NextResponse } from "next/server";
import { Workbook } from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import { formatEur, formatNumber } from "@/lib/currency";
import { listAiUsageLogs } from "@/lib/queries/super-admins";
import { csvEscape, getIsoDateStamp } from "@/lib/export-utils";
import { formatDateTimePt } from "@/lib/formatting";

type ExportFormat = "xlsx" | "csv" | "pdf" | "json";

type AiUsageRow = {
  id: string;
  created_at: string;
  company_id: string | null;
  company_name: string | null;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  cost_eur: number;
  latency_ms: number | null;
};

function getPeriodLabel(from: string, to: string): string {
  if (from && to) return `${from} a ${to}`;
  if (from) return `Desde ${from}`;
  if (to) return `Ate ${to}`;
  return "Todos";
}

function toTableRow(row: AiUsageRow) {
  return {
    date: formatDateTimePt(row.created_at),
    company: row.company_name || "-",
    feature: row.feature,
    model: row.model,
    inputTokens: Number(row.prompt_tokens || 0),
    outputTokens: Number(row.completion_tokens || 0),
    totalTokens: Number(row.total_tokens || 0),
    costEur: Number(row.cost_eur || 0),
  };
}

function buildCsv(rows: AiUsageRow[]): string {
  const header = [
    "Data",
    "Empresa",
    "Feature",
    "Modelo",
    "Input tokens",
    "Output tokens",
    "Total tokens",
    "Custo EUR",
  ];
  const lines = [header.join(",")];

  for (const row of rows) {
    const tableRow = toTableRow(row);
    lines.push(
      [
        csvEscape(tableRow.date),
        csvEscape(tableRow.company),
        csvEscape(tableRow.feature),
        csvEscape(tableRow.model),
        csvEscape(tableRow.inputTokens),
        csvEscape(tableRow.outputTokens),
        csvEscape(tableRow.totalTokens),
        csvEscape(tableRow.costEur.toFixed(6)),
      ].join(","),
    );
  }

  return lines.join("\n");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

async function buildXlsx(rows: AiUsageRow[]): Promise<Uint8Array> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("AI Usage Logs");

  sheet.columns = [
    { header: "Data", key: "date", width: 20 },
    { header: "Empresa", key: "company", width: 30 },
    { header: "Feature", key: "feature", width: 20 },
    { header: "Modelo", key: "model", width: 18 },
    { header: "Input tokens", key: "inputTokens", width: 14 },
    { header: "Output tokens", key: "outputTokens", width: 14 },
    { header: "Total tokens", key: "totalTokens", width: 14 },
    { header: "Custo EUR", key: "costEur", width: 14 },
  ];

  for (const row of rows) {
    sheet.addRow(toTableRow(row));
  }

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (let i = 2; i <= sheet.rowCount; i += 1) {
    sheet.getCell(`H${i}`).numFmt = "#,##0.000000";
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}

function calculateTotals(rows: AiUsageRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.calls += 1;
      acc.prompt += Number(row.prompt_tokens || 0);
      acc.completion += Number(row.completion_tokens || 0);
      acc.total += Number(row.total_tokens || 0);
      acc.cost += Number(row.cost_eur || 0);
      return acc;
    },
    { calls: 0, prompt: 0, completion: 0, total: 0, cost: 0 },
  );
}

async function buildPdf(rows: AiUsageRow[], periodLabel: string): Promise<Uint8Array> {
  const totals = calculateTotals(rows);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 560;
  page.drawText("Relatorio de Uso de IA", {
    x: 36,
    y,
    size: 20,
    font: bold,
    color: rgb(0.1, 0.13, 0.19),
  });
  y -= 24;
  page.drawText(`Periodo: ${periodLabel}`, { x: 36, y, size: 10, font, color: rgb(0.35, 0.39, 0.45) });
  y -= 22;

  const summaryLines = [
    `Total de chamadas: ${formatNumber(totals.calls)}`,
    `Tokens input: ${formatNumber(totals.prompt)}`,
    `Tokens output: ${formatNumber(totals.completion)}`,
    `Tokens totais: ${formatNumber(totals.total)}`,
    `Custo total (EUR): ${formatEur(totals.cost, { maxDecimals: 6 })}`,
  ];

  for (const line of summaryLines) {
    page.drawText(line, { x: 36, y, size: 11, font, color: rgb(0.13, 0.16, 0.23) });
    y -= 16;
  }

  y -= 8;
  page.drawLine({ start: { x: 36, y }, end: { x: 806, y }, thickness: 1, color: rgb(0.88, 0.9, 0.93) });
  y -= 18;

  const headers = ["Data", "Empresa", "Feature", "Modelo", "Input", "Output", "Total", "Custo EUR"];
  const columnsX = [36, 120, 250, 330, 430, 495, 560, 635];

  headers.forEach((header, idx) => {
    page.drawText(header, { x: columnsX[idx], y, size: 9, font: bold, color: rgb(0.34, 0.38, 0.46) });
  });
  y -= 14;

  const tableRows = rows.slice(0, 18);
  for (const row of tableRows) {
    const tableRow = toTableRow(row);
    const values = [
      tableRow.date,
      tableRow.company,
      tableRow.feature,
      tableRow.model,
      formatNumber(tableRow.inputTokens),
      formatNumber(tableRow.outputTokens),
      formatNumber(tableRow.totalTokens),
      tableRow.costEur.toFixed(6),
    ];

    values.forEach((value, idx) => {
      const maxLen = idx === 0 ? 16 : idx === 1 ? 22 : 14;
      const safeValue = value.length > maxLen ? `${value.slice(0, maxLen - 1)}...` : value;
      page.drawText(safeValue, { x: columnsX[idx], y, size: 8, font, color: rgb(0.18, 0.22, 0.29) });
    });

    y -= 13;
    if (y < 46) break;
  }

  if (rows.length > tableRows.length) {
    page.drawText(
      `+ ${rows.length - tableRows.length} registos nao mostrados nesta tabela resumida`,
      { x: 36, y: 28, size: 8, font, color: rgb(0.4, 0.45, 0.52) },
    );
  }

  return await pdf.save();
}

export async function GET(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = String(searchParams.get("format") || "").toLowerCase() as ExportFormat;

  if (!["xlsx", "csv", "pdf", "json"].includes(format)) {
    return NextResponse.json(
      { error: "Formato invalido. Use: xlsx, csv, pdf ou json." },
      { status: 400 },
    );
  }

  const filters = {
    companyId: searchParams.get("companyId") || "",
    model: searchParams.get("model") || "",
    feature: searchParams.get("feature") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    q: searchParams.get("q") || "",
  };

  const result = await listAiUsageLogs({ ...filters, page: 1, pageSize: 5000 });
  const dateStamp = getIsoDateStamp();
  const periodLabel = getPeriodLabel(filters.from, filters.to);

  if (format === "csv") {
    const csv = buildCsv(result.rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ai-usage-${dateStamp}.csv"`,
      },
    });
  }

  if (format === "json") {
    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        period: periodLabel,
        filters,
        total: result.total,
        rows: result.rows,
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="ai-usage-technical-${dateStamp}.json"`,
        },
      },
    );
  }

  if (format === "xlsx") {
    const xlsxBuffer = await buildXlsx(result.rows);
    return new NextResponse(toArrayBuffer(xlsxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ai-usage-${dateStamp}.xlsx"`,
      },
    });
  }

  const pdfBytes = await buildPdf(result.rows, periodLabel);
  return new NextResponse(toArrayBuffer(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ai-usage-report-${dateStamp}.pdf"`,
    },
  });
}
