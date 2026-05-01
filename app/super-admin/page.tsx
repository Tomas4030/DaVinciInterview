import { redirect } from "next/navigation";
import SuperAdminShell from "@/components/super-admin/SuperAdminShell";
import MetricCard from "@/components/super-admin/MetricCard";
import SuperAdminOverviewCharts from "@/components/super-admin/SuperAdminOverviewCharts";
import OverviewFilters from "@/components/super-admin/OverviewFilters";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import {
  getAiCostByFeatureLast30d,
  getDailyAiCostLast30d,
  getSuperAdminDashboardStats,
  getTokenBreakdownByPeriod,
  getTopCompaniesByAiCostLast30d,
} from "@/lib/queries/super-admins";
import { formatEur, formatNumber } from "@/lib/currency";
import { getDefaultLast30DaysRange } from "@/lib/date-range";

type Props = {
  searchParams?: {
    from?: string;
    to?: string;
    granularity?: "daily" | "monthly" | "yearly";
  };
};

export default async function SuperAdminDashboardPage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const defaultRange = getDefaultLast30DaysRange();
  const from = searchParams?.from || defaultRange.from;
  const to = searchParams?.to || defaultRange.to;
  const granularity =
    searchParams?.granularity === "monthly" || searchParams?.granularity === "yearly"
      ? searchParams.granularity
      : "daily";

  const [stats, dailyCost, featureCost, topCompanies, tokenBreakdown] = await Promise.all([
    getSuperAdminDashboardStats({ from, to }),
    getDailyAiCostLast30d({ from, to }, granularity),
    getAiCostByFeatureLast30d({ from, to }),
    getTopCompaniesByAiCostLast30d({ from, to }),
    getTokenBreakdownByPeriod({ from, to }),
  ]);

  const costPerCall =
    stats.aiCallsLast30d > 0
      ? stats.aiCostLast30dEur / stats.aiCallsLast30d
      : 0;

  return (
    <SuperAdminShell active="overview">
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Overview
            </h1>
            <p className="mt-1 text-sm text-[#787774]">
              Global platform overview and key metrics
            </p>
          </div>
        </header>

        <OverviewFilters
          from={from}
          to={to}
          granularity={granularity}
        />

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            title="Custo IA (30d)"
            value={formatEur(stats.aiCostLast30dEur, { maxDecimals: 2 })}
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
          totalCost={stats.aiCostLast30dEur}
          costPerCall={costPerCall}
          totalInputTokens={tokenBreakdown.input_tokens}
          totalOutputTokens={tokenBreakdown.output_tokens}
          granularity={granularity}
        />
      </div>
    </SuperAdminShell>
  );
}
