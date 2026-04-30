import { redirect } from "next/navigation";
import MetricCard from "@/components/super-admin/MetricCard";
import OverviewCharts from "@/components/super-admin/OverviewCharts";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import { formatEur, usdToEur } from "@/lib/currency";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import {
  getAiCostByFeature,
  getDailyAiCost,
  getSuperAdminDashboardStats,
  getTokenBreakdown,
  getTopCompaniesByAiCost,
} from "@/lib/queries/super-admins";

export default async function SuperAdminDashboardPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const [stats, dailyCostUsd, featureCostUsd, topCompaniesUsd, tokenBreakdown] = await Promise.all([
    getSuperAdminDashboardStats(),
    getDailyAiCost(),
    getAiCostByFeature(),
    getTopCompaniesByAiCost(5),
    getTokenBreakdown(),
  ]);

  const dailyCost = dailyCostUsd.map((item) => ({
    day: item.day,
    cost_eur: usdToEur(item.cost_usd),
  }));

  const featureCost = featureCostUsd.map((item) => ({
    feature: item.feature,
    cost_eur: usdToEur(item.cost_usd),
  }));

  const topCompanies = topCompaniesUsd.map((item) => ({
    company_name: item.company_name,
    cost_eur: usdToEur(item.cost_usd),
  }));

  const costThisMonthEur = usdToEur(stats.aiCostThisMonthUsd);
  const avgCostPerCall = stats.aiCallsThisMonth > 0 ? costThisMonthEur / stats.aiCallsThisMonth : 0;
  const topCompany = topCompanies[0];
  const inputShare = tokenBreakdown.total_tokens > 0
    ? Math.round((tokenBreakdown.input_tokens / tokenBreakdown.total_tokens) * 100)
    : 0;

  return (
    <SuperAdminShell active="overview">
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
            <p className="text-sm text-slate-500">Visão global da plataforma e custo de IA.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">Este mês</div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Custo IA este mês" value={formatEur(costThisMonthEur, 2, 4)} subtitle="custos acumulados" />
          <MetricCard title="Tokens totais" value={tokenBreakdown.total_tokens.toLocaleString("pt-PT")} subtitle="prompt + output" />
          <MetricCard title="Empresas ativas" value={stats.activeCompanies.toLocaleString("pt-PT")} subtitle={`de ${stats.totalCompanies} empresas`} />
          <MetricCard title="Chamadas IA" value={stats.aiCallsThisMonth.toLocaleString("pt-PT")} subtitle="no período selecionado" />
        </section>

        <OverviewCharts dailyCost={dailyCost} featureCost={featureCost} topCompanies={topCompanies} />

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Empresa com maior consumo</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{topCompany?.company_name || "-"}</p>
            <p className="mt-1 text-sm text-slate-600">{topCompany ? formatEur(topCompany.cost_eur, 2, 4) : formatEur(0)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Custo médio por chamada</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatEur(avgCostPerCall, 4, 6)}</p>
            <p className="mt-1 text-sm text-slate-600">com base no período atual</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Input / Output tokens</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${inputShare}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-600">
              <span>Input: {tokenBreakdown.input_tokens.toLocaleString("pt-PT")}</span>
              <span>Output: {tokenBreakdown.output_tokens.toLocaleString("pt-PT")}</span>
            </div>
          </article>
        </section>
      </div>
    </SuperAdminShell>
  );
}
