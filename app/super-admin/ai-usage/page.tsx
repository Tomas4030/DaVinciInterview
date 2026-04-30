import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import MetricCard from "@/components/super-admin/MetricCard";
import DataTable from "@/components/super-admin/DataTable";
import StatusBadge from "@/components/super-admin/StatusBadge";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listAiUsageLogs } from "@/lib/queries/super-admins";
import { formatEur, formatNumber } from "@/lib/currency";

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

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

  const page = Math.max(Number(searchParams?.page || 1), 1);

  const result = await listAiUsageLogs({
    companyId: searchParams?.companyId,
    model: searchParams?.model,
    feature: searchParams?.feature,
    from: searchParams?.from,
    to: searchParams?.to,
    q: searchParams?.q,
    page,
    pageSize: 20,
  });

  const rows = result.rows;

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

  return (
    <SuperAdminShell active="ai-usage">
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Uso de IA
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Logs detalhados de uso de IA na plataforma
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              30 Apr - 30 May 2026
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Filtros
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              Exportar
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-3 lg:grid-cols-[1fr,1fr,1fr,1fr,160px]">
            <select className="h-11 rounded-xl border border-slate-200 px-4 text-sm">
              <option>Todas as empresas</option>
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-4 text-sm">
              <option>Todas as features</option>
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-4 text-sm">
              <option>Todos os modelos</option>
            </select>
            <input
              placeholder="Pesquisar..."
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none"
            />
            <button className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white">
              Aplicar
            </button>
          </div>
        </section>

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
                Mostrando 1 a {rows.length} de {rows.length} logs
              </span>
              <div className="flex items-center gap-2 text-sm">
                <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-400">
                  ‹
                </button>
                <button className="rounded-lg bg-indigo-600 px-3 py-1 text-white">
                  1
                </button>
                <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-400">
                  ›
                </button>
              </div>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                {formatDateTime(row.created_at)}
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
