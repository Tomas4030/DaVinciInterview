import { redirect } from "next/navigation";
import DataTable from "@/components/super-admin/DataTable";
import MetricCard from "@/components/super-admin/MetricCard";
import StatusBadge from "@/components/super-admin/StatusBadge";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import { formatEur, usdToEur } from "@/lib/currency";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listAiUsageFilterOptions, listAiUsageLogs } from "@/lib/queries/super-admins";

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return String(value);
  }
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

function badgeToneByFeature(feature: string): "blue" | "green" | "purple" | "default" {
  if (feature.includes("interview")) return "blue";
  if (feature.includes("analysis")) return "green";
  if (feature.includes("generate")) return "purple";
  return "default";
}

export default async function SuperAdminAiUsagePage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const page = Math.max(Number(searchParams?.page || 1), 1);

  const [result, options] = await Promise.all([
    listAiUsageLogs({
      companyId: searchParams?.companyId,
      model: searchParams?.model,
      feature: searchParams?.feature,
      from: searchParams?.from,
      to: searchParams?.to,
      q: searchParams?.q,
      page,
      pageSize: 15,
    }),
    listAiUsageFilterOptions(),
  ]);

  const rows = result.rows;
  const totalPages = Math.max(Math.ceil(result.total / 15), 1);

  const totals = rows.reduce(
    (acc, row) => {
      acc.calls += 1;
      acc.prompt += Number(row.prompt_tokens || 0);
      acc.completion += Number(row.completion_tokens || 0);
      acc.total += Number(row.total_tokens || 0);
      acc.cost += Number(usdToEur(row.cost_usd || 0));
      return acc;
    },
    { calls: 0, prompt: 0, completion: 0, total: 0, cost: 0 },
  );

  return (
    <SuperAdminShell active="ai-usage">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Uso de IA</h1>
          <p className="text-sm text-slate-500">Logs detalhados de uso e custo de IA.</p>
        </header>

        <form className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-5">
          <select name="companyId" defaultValue={searchParams?.companyId || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Todas empresas</option>
            {options.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
          <select name="feature" defaultValue={searchParams?.feature || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Todas features</option>
            {options.features.map((feature) => <option key={feature} value={feature}>{feature}</option>)}
          </select>
          <select name="model" defaultValue={searchParams?.model || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Todos modelos</option>
            {options.models.map((model) => <option key={model} value={model}>{model}</option>)}
          </select>
          <input name="q" defaultValue={searchParams?.q || ""} placeholder="Pesquisar" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Aplicar</button>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Chamadas" value={totals.calls.toLocaleString("pt-PT")} />
          <MetricCard title="Tokens input" value={totals.prompt.toLocaleString("pt-PT")} />
          <MetricCard title="Tokens output" value={totals.completion.toLocaleString("pt-PT")} />
          <MetricCard title="Tokens totais" value={totals.total.toLocaleString("pt-PT")} />
          <MetricCard title="Custo total" value={formatEur(totals.cost, 4, 6)} />
        </section>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Sem resultados para os filtros selecionados.
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "date", label: "Data" },
              { key: "company", label: "Empresa" },
              { key: "feature", label: "Feature" },
              { key: "model", label: "Modelo" },
              { key: "input", label: "Input", align: "right" },
              { key: "output", label: "Output", align: "right" },
              { key: "total", label: "Total", align: "right" },
              { key: "cost", label: "Custo" , align: "right"},
            ]}
            footer={
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Mostrando {rows.length} de {result.total} logs</span>
                <div className="flex items-center gap-2">
                  <span>Página {page} de {totalPages}</span>
                  <a className="rounded-lg border border-slate-200 px-2 py-1" href={`/super-admin/ai-usage?page=${Math.max(page - 1, 1)}`}>‹</a>
                  <a className="rounded-lg border border-slate-200 px-2 py-1" href={`/super-admin/ai-usage?page=${Math.min(page + 1, totalPages)}`}>›</a>
                </div>
              </div>
            }
          >
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-700">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-3 text-slate-700">{row.company_name || "-"}</td>
                <td className="px-4 py-3"><StatusBadge tone={badgeToneByFeature(row.feature)}>{row.feature}</StatusBadge></td>
                <td className="px-4 py-3"><StatusBadge>{row.model}</StatusBadge></td>
                <td className="px-4 py-3 text-right text-slate-700">{row.prompt_tokens.toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right text-slate-700">{row.completion_tokens.toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right text-slate-700">{row.total_tokens.toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{formatEur(usdToEur(row.cost_usd), 4, 6)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </SuperAdminShell>
  );
}
