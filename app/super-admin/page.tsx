import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import MetricCard from "@/components/super-admin/MetricCard";
import SuperAdminOverviewCharts from "@/components/super-admin/SuperAdminOverviewCharts";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import {
  getAiCostByFeatureLast30d,
  getDailyAiCostLast30d,
  getSuperAdminDashboardStats,
  getTopCompaniesByAiCostLast30d,
} from "@/lib/queries/super-admins";
import { formatEur, formatNumber } from "@/lib/currency";

export default async function SuperAdminDashboardPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const [stats, dailyCost, featureCost, topCompanies] = await Promise.all([
    getSuperAdminDashboardStats(),
    getDailyAiCostLast30d(),
    getAiCostByFeatureLast30d(),
    getTopCompaniesByAiCostLast30d(),
  ]);

  return (
    <SuperAdminShell active="overview">
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Global platform overview and key metrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              30 Apr - 30 May 2026
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              ↻
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Custo IA (30d)"
            value={formatEur(stats.aiCostLast30dEur)}
            delta="+18.6%"
            subtitle="vs 30 dias anteriores"
          />
          <MetricCard
            title="Tokens Totais (30d)"
            value={formatNumber(stats.totalTokensLast30d)}
            delta="+12.4%"
            subtitle="vs 30 dias anteriores"
          />
          <MetricCard
            title="Empresas Ativas"
            value={formatNumber(stats.activeCompanies)}
            subtitle={`${stats.totalCompanies} empresas totais`}
          />
          <MetricCard
            title="Chamadas de IA (30d)"
            value={formatNumber(stats.aiCallsLast30d)}
            delta="+25%"
            subtitle="vs 30 dias anteriores"
          />
        </section>

        <SuperAdminOverviewCharts
          dailyCost={dailyCost}
          featureCost={featureCost}
          topCompanies={topCompanies}
        />
      </div>
    </SuperAdminShell>
  );
}
