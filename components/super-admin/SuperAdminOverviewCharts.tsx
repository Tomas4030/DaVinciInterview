"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEur, formatNumber } from "@/lib/currency";

type DailyCost = {
  day: string;
  cost_eur: number;
};

type FeatureCost = {
  feature: string;
  cost_eur: number;
};

type CompanyCost = {
  company_name: string;
  cost_eur: number;
};

type Props = {
  dailyCost: DailyCost[];
  featureCost: FeatureCost[];
  topCompanies: CompanyCost[];
  totalCost: number;
  costPerCall: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  granularity: "daily" | "monthly" | "yearly";
};

const COLORS = ["#5B4DF3", "#2CCF91", "#FFCB66", "#EF5DA8", "#9CA3AF"];

export default function SuperAdminOverviewCharts({
  dailyCost,
  featureCost,
  topCompanies,
  totalCost,
  costPerCall,
  totalInputTokens,
  totalOutputTokens,
  granularity,
}: Props) {
  const chartDaily = dailyCost;
  const chartFeatures = featureCost;
  const chartCompanies = topCompanies;

  const featureTotal =
    chartFeatures.reduce((sum, item) => sum + Number(item.cost_eur || 0), 0) ||
    1;

  const totalTokens = totalInputTokens + totalOutputTokens;
  const inputPercentage = totalTokens
    ? Math.round((totalInputTokens / totalTokens) * 100)
    : 0;
  const outputPercentage = totalTokens ? 100 - inputPercentage : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[1.45fr,1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-950">Custo de IA</h2>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartDaily}
                margin={{ top: 8, right: 12, left: 14, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B4DF3" stopOpacity={0.28} />
                    <stop
                      offset="100%"
                      stopColor="#5B4DF3"
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e8edf5"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tick={{ fontSize: 11, fill: "#8A97AD" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8A97AD" }}
                  tickFormatter={(v) => `${Number(v).toFixed(4)} €`}
                />
                <Tooltip
                  formatter={(value) =>
                    formatEur(Number(value), { maxDecimals: 4 })
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15,23,42,.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cost_eur"
                  stroke="#5B4DF3"
                  strokeWidth={2.2}
                  fill="url(#costFill)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <h2 className="mb-3 text-sm font-bold text-slate-950">
            Custo por Feature (30d)
          </h2>

          <div className="grid items-center gap-4 md:grid-cols-[220px,1fr] xl:grid-cols-[210px,1fr]">
            <div className="relative h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartFeatures}
                    dataKey="cost_eur"
                    nameKey="feature"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartFeatures.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatEur(Number(value), { maxDecimals: 4 })
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold text-slate-950">
                  {formatEur(totalCost, { maxDecimals: 2 })}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>

            <div className="space-y-3">
              {chartFeatures.map((item, index) => {
                const percentage = Math.round(
                  (Number(item.cost_eur || 0) / featureTotal) * 100,
                );

                return (
                  <div
                    key={item.feature}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="truncate text-slate-600">
                        {item.feature}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.95fr,1fr,1.25fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <h2 className="mb-4 text-sm font-bold text-slate-950">
            Top Empresa por Custo (30d)
          </h2>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {chartCompanies[0]?.company_name || "-"}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Maior consumo no período selecionado
              </p>
            </div>

            <p className="text-lg font-bold text-slate-950">
              {formatEur(chartCompanies[0]?.cost_eur || 0, { maxDecimals: 2 })}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <h2 className="mb-4 text-sm font-bold text-slate-950">
            Custo Médio por Chamada
          </h2>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xl font-bold text-slate-950">
                {formatEur(costPerCall, { maxDecimals: 4 })}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Baseado em chamadas reais
              </p>
            </div>

            <div className="h-10 w-10 rounded-lg bg-indigo-50" />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <h2 className="mb-4 text-sm font-bold text-slate-950">
            Tokens por Tipo (30d)
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Input</span>
                <span className="font-bold text-slate-900">
                  {formatNumber(totalInputTokens)} ({inputPercentage}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${inputPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Output</span>
                <span className="font-bold text-slate-900">
                  {formatNumber(totalOutputTokens)} ({outputPercentage}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${outputPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
