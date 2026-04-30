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
import { formatEur } from "@/lib/currency";

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
};

const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function SuperAdminOverviewCharts({
  dailyCost,
  featureCost,
  topCompanies,
}: Props) {
  const totalFeatureCost = featureCost.reduce(
    (sum, item) => sum + Number(item.cost_eur || 0),
    0,
  );

  return (
    <>
      <section className="grid gap-5 xl:grid-cols-[1.4fr,0.9fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Custo de IA (€)
            </h2>
            <span className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500">
              Diário
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCost}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value) =>
                    formatEur(Number(value), { maxDecimals: 4 })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cost_eur"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#costGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            Custo por Feature (30d)
          </h2>

          <div className="grid items-center gap-4 md:grid-cols-[180px,1fr] xl:grid-cols-1">
            <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featureCost}
                    dataKey="cost_eur"
                    nameKey="feature"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {featureCost.map((_, index) => (
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
                  {formatEur(totalFeatureCost, { maxDecimals: 2 })}
                </p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>

            <div className="space-y-3">
              {featureCost.map((item, index) => {
                const percentage = totalFeatureCost
                  ? Math.round(
                      (Number(item.cost_eur || 0) / totalFeatureCost) * 100,
                    )
                  : 0;

                return (
                  <div
                    key={item.feature}
                    className="flex items-center justify-between gap-3 text-sm"
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
                    <span className="font-semibold text-slate-900">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            Top Empresas por Custo (30d)
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="company_name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <Tooltip
                  formatter={(value) =>
                    formatEur(Number(value), { maxDecimals: 4 })
                  }
                />
                <Bar dataKey="cost_eur" fill="#4f46e5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            Resumo Operacional
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Empresa com maior consumo
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {topCompanies[0]?.company_name || "-"}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">
                {formatEur(topCompanies[0]?.cost_eur || 0, { maxDecimals: 4 })}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Features monitorizadas</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {featureCost.length}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                Com dados reais de uso
              </p>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
