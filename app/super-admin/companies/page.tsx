import { redirect } from "next/navigation";
import DataTable from "@/components/super-admin/DataTable";
import MetricCard from "@/components/super-admin/MetricCard";
import StatusBadge from "@/components/super-admin/StatusBadge";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import { formatEur, usdToEur } from "@/lib/currency";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listCompaniesUsageSummary } from "@/lib/queries/super-admins";

type Props = {
  searchParams?: {
    q?: string;
    page?: string;
  };
};

function getStatusTone(status: string): "green" | "amber" | "red" | "default" {
  if (status === "active" || status === "trialing") return "green";
  if (status === "past_due") return "amber";
  if (status === "canceled") return "red";
  return "default";
}

function getPlanTone(plan: string): "blue" | "purple" | "default" {
  if (plan === "pro") return "purple";
  if (plan === "enterprise") return "blue";
  return "default";
}

export default async function SuperAdminCompaniesPage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const allRows = await listCompaniesUsageSummary();
  const q = String(searchParams?.q || "").trim().toLowerCase();
  const page = Math.max(Number(searchParams?.page || 1), 1);
  const pageSize = 10;

  const rowsFiltered = q
    ? allRows.filter(
        (row) =>
          row.company_name.toLowerCase().includes(q) || row.company_slug.toLowerCase().includes(q),
      )
    : allRows;

  const totalPages = Math.max(Math.ceil(rowsFiltered.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const rows = rowsFiltered.slice(offset, offset + pageSize);

  const totalCostEur = rowsFiltered.reduce((acc, row) => acc + usdToEur(row.total_cost_30d_usd), 0);
  const activeCount = rowsFiltered.filter((row) => row.subscription_status === "active" || row.subscription_status === "trialing").length;
  const avgCostPerCompany = rowsFiltered.length > 0 ? totalCostEur / rowsFiltered.length : 0;

  return (
    <SuperAdminShell active="companies">
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
            <p className="text-sm text-slate-500">Consumo e custo de IA por empresa.</p>
          </div>
          <div className="flex gap-2">
            <form className="flex">
              <input
                name="q"
                defaultValue={q}
                placeholder="Pesquisar empresa"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              />
            </form>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">Exportar</button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total empresas" value={rowsFiltered.length.toLocaleString("pt-PT")} />
          <MetricCard title="Empresas ativas" value={activeCount.toLocaleString("pt-PT")} />
          <MetricCard title="Custo total IA" value={formatEur(totalCostEur, 2, 4)} />
          <MetricCard title="Custo médio/empresa" value={formatEur(avgCostPerCompany, 2, 4)} />
        </section>

        <DataTable
          columns={[
            { key: "company", label: "Empresa" },
            { key: "plan", label: "Plano" },
            { key: "status", label: "Status" },
            { key: "calls", label: "Entrevistas/Chamadas", align: "right" },
            { key: "cost", label: "Custo IA" , align: "right"},
            { key: "tokens", label: "Tokens", align: "right" },
            { key: "margin", label: "Margem IA", align: "right" },
            { key: "actions", label: "Ações", align: "right" },
          ]}
          footer={
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Mostrando {rows.length} de {rowsFiltered.length} empresas</span>
              <div className="flex items-center gap-2">
                <span>Página {safePage} de {totalPages}</span>
                <a className="rounded-lg border border-slate-200 px-2 py-1" href={`/super-admin/companies?page=${Math.max(safePage - 1, 1)}&q=${encodeURIComponent(q)}`}>‹</a>
                <a className="rounded-lg border border-slate-200 px-2 py-1" href={`/super-admin/companies?page=${Math.min(safePage + 1, totalPages)}&q=${encodeURIComponent(q)}`}>›</a>
              </div>
            </div>
          }
        >
          {rows.map((row) => (
            <tr key={row.company_id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{row.company_name}</p>
                <p className="text-xs text-slate-500">{row.company_slug}</p>
              </td>
              <td className="px-4 py-3"><StatusBadge tone={getPlanTone(row.plan)}>{row.plan}</StatusBadge></td>
              <td className="px-4 py-3"><StatusBadge tone={getStatusTone(row.subscription_status)}>{row.subscription_status}</StatusBadge></td>
              <td className="px-4 py-3 text-right text-slate-700">{row.interviews_count} / {row.total_calls_30d}</td>
              <td className="px-4 py-3 text-right font-medium text-slate-900">{formatEur(usdToEur(row.total_cost_30d_usd), 2, 4)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{row.total_tokens_30d.toLocaleString("pt-PT")}</td>
              <td className="px-4 py-3 text-right text-emerald-600">+{row.estimated_margin_pct}%</td>
              <td className="px-4 py-3 text-right"><button className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Ver</button></td>
            </tr>
          ))}
        </DataTable>
      </div>
    </SuperAdminShell>
  );
}
