import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import MetricCard from "@/components/super-admin/MetricCard";
import DataTable from "@/components/super-admin/DataTable";
import StatusBadge from "@/components/super-admin/StatusBadge";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listCompaniesUsageSummary } from "@/lib/queries/super-admins";
import { formatEur, formatNumber } from "@/lib/currency";

const PLAN_PRICE: Record<string, number> = {
  basic: 49,
  pro: 149,
  enterprise: 499,
};

function planTone(plan?: string | null) {
  if (plan === "pro") return "purple";
  if (plan === "enterprise") return "blue";
  if (plan === "basic") return "blue";
  return "default";
}

function statusTone(status?: string | null) {
  if (status === "active" || status === "trialing") return "green";
  if (status === "canceled" || status === "past_due") return "red";
  return "default";
}

export default async function SuperAdminCompaniesPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const rows = await listCompaniesUsageSummary();

  const totalCost = rows.reduce(
    (sum, row) => sum + Number(row.total_cost_30d_eur || 0),
    0,
  );
  const activeCompanies = rows.filter((row) =>
    ["active", "trialing"].includes(String(row.subscription_status)),
  ).length;

  const avgCost = rows.length ? totalCost / rows.length : 0;

  return (
    <SuperAdminShell active="companies">
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Empresas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Consumo de IA por empresa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="Pesquisar empresa..."
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />
            <button className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
              30 Apr - 30 May 2026
            </button>
            <button className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
              Exportar
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total empresas"
            value={formatNumber(rows.length)}
          />
          <MetricCard
            title="Empresas ativas"
            value={formatNumber(activeCompanies)}
          />
          <MetricCard
            title="Custo total IA"
            value={formatEur(totalCost)}
            subtitle="Este mês"
          />
          <MetricCard
            title="Custo médio/empresa"
            value={formatEur(avgCost)}
            subtitle="Por empresa"
          />
        </section>

        <DataTable
          columns={[
            { key: "company", label: "Empresa" },
            { key: "plan", label: "Plano" },
            { key: "status", label: "Status" },
            { key: "calls", label: "Chamadas", align: "center" },
            { key: "cost", label: "Custo IA", align: "right" },
            { key: "tokens", label: "Tokens", align: "right" },
            { key: "margin", label: "Margem IA", align: "right" },
            { key: "actions", label: "Ações", align: "right" },
          ]}
          footer={
            <>
              <span className="text-sm text-slate-500">
                Mostrando 1 a {rows.length} de {rows.length} empresas
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
          {rows.map((row) => {
            const planPrice = PLAN_PRICE[String(row.plan || "")] || 0;
            const margin = planPrice ? planPrice - row.total_cost_30d_eur : 0;
            const marginPercent = planPrice
              ? Math.round((margin / planPrice) * 100)
              : 0;

            return (
              <tr key={row.company_id}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">
                    {row.company_name}
                  </p>
                  <p className="text-xs text-slate-500">{row.company_slug}</p>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge tone={planTone(row.plan)}>
                    {row.plan || "-"}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge tone={statusTone(row.subscription_status)}>
                    {row.subscription_status || "-"}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4 text-center text-slate-700">
                  {row.total_calls_30d}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-900">
                  {formatEur(row.total_cost_30d_eur)}
                </td>
                <td className="px-5 py-4 text-right text-slate-700">
                  {formatNumber(row.total_tokens_30d)}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                  {planPrice ? `+${marginPercent}%` : "-"}
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    ›
                  </button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </SuperAdminShell>
  );
}
