import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import MetricCard from "@/components/super-admin/MetricCard";
import DataTable from "@/components/super-admin/DataTable";
import StatusBadge from "@/components/super-admin/StatusBadge";
import AiUsageFilters from "@/components/super-admin/AiUsageFilters";
import AiUsageExportDropdown from "@/components/super-admin/AiUsageExportDropdown";
import TablePaginationLinks from "@/components/super-admin/TablePaginationLinks";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import {
  listAiUsageFilterOptions,
  listAiUsageLogs,
} from "@/lib/queries/super-admins";
import { formatEur, formatNumber } from "@/lib/currency";
import { formatDateTimePt } from "@/lib/formatting";

type Props = {
  searchParams?: {
    companyId?: string;
    model?: string;
    feature?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
  };
};

export default async function SuperAdminAiUsagePage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const companyId = String(searchParams?.companyId || "");
  const feature = String(searchParams?.feature || "");
  const model = String(searchParams?.model || "");
  const q = String(searchParams?.q || "");
  const from = String(searchParams?.from || "");
  const to = String(searchParams?.to || "");
  const page = Math.max(Number(searchParams?.page || 1), 1);

  const [result, options] = await Promise.all([
    listAiUsageLogs({
      companyId,
      model,
      feature,
      from,
      to,
      q,
      page,
      pageSize: 20,
    }),
    listAiUsageFilterOptions(),
  ]);

  const rows = result.rows;
  const totalPages = Math.max(Math.ceil(result.total / 20), 1);

  const totals = rows.reduce(
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

  const listParams = { companyId, feature, model, from, to, q };

  return (
    <SuperAdminShell active="ai-usage">
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Uso de IA
            </h1>
            <p className="mt-1 text-sm text-[#787774]">
              Logs detalhados de uso de IA na plataforma
            </p>
          </div>

          <AiUsageExportDropdown
            companyId={companyId}
            feature={feature}
            model={model}
            from={from}
            to={to}
            q={q}
          />
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Chamadas"
            value={formatNumber(totals.calls)}
            delta="+25%"
          />
          <MetricCard
            title="Tokens input"
            value={formatNumber(totals.prompt)}
            delta="+12.3%"
          />
          <MetricCard
            title="Tokens output"
            value={formatNumber(totals.completion)}
            delta="+9.7%"
          />
          <MetricCard
            title="Tokens totais"
            value={formatNumber(totals.total)}
            delta="+11.0%"
          />
          <MetricCard
            title="Custo total"
            value={formatEur(totals.cost)}
            delta="+10.8%"
          />
        </section>

        <AiUsageFilters
          companyId={companyId}
          feature={feature}
          model={model}
          q={q}
          from={from}
          to={to}
          companies={options.companies}
          features={options.features}
          models={options.models}
        />

        <DataTable
          columns={[
            { key: "date", label: "Data" },
            { key: "company", label: "Empresa" },
            { key: "feature", label: "Feature" },
            { key: "model", label: "Modelo" },
            { key: "input", label: "Input", align: "right" },
            { key: "output", label: "Output", align: "right" },
            { key: "total", label: "Total", align: "right" },
            { key: "cost", label: "Custo", align: "right" },
          ]}
          footer={
            <>
              <span className="text-sm text-slate-500">
                Mostrando {rows.length} de {result.total} logs
              </span>
              <TablePaginationLinks
                basePath="/super-admin/ai-usage"
                params={listParams}
                page={page}
                totalPages={totalPages}
              />
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                {formatDateTimePt(row.created_at)}
              </td>
              <td className="px-5 py-4 font-medium text-slate-800">
                {row.company_name || "-"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge tone="purple">{row.feature}</StatusBadge>
              </td>
              <td className="px-5 py-4">
                <StatusBadge>{row.model}</StatusBadge>
              </td>
              <td className="px-5 py-4 text-right text-slate-700">
                {formatNumber(row.prompt_tokens)}
              </td>
              <td className="px-5 py-4 text-right text-slate-700">
                {formatNumber(row.completion_tokens)}
              </td>
              <td className="px-5 py-4 text-right font-medium text-slate-900">
                {formatNumber(row.total_tokens)}
              </td>
              <td className="px-5 py-4 text-right font-semibold text-slate-950">
                {formatEur(row.cost_eur, { maxDecimals: 6 })}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </SuperAdminShell>
  );
}
