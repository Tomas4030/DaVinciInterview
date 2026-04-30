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

type Props = {
  searchParams?: {
    from?: string;
    to?: string;
    granularity?: "daily" | "monthly" | "yearly";
  };
};

function defaultFromDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SuperAdminDashboardPage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const from = searchParams?.from || defaultFromDate();
  const to = searchParams?.to || defaultToDate();
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
      <div className="w-full space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#eaeaea] bg-white px-5 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] md:px-6">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">
              Overview
            </h1>
            <p className="mt-1 text-sm text-[#787774]">
              Global platform overview and key metrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <OverviewFilters
              from={from}
              to={to}
              granularity={granularity}
            />
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
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
