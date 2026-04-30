"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import ChartCard from "@/components/super-admin/ChartCard";
import { formatEur } from "@/lib/currency";

type Props = {
  dailyCost: Array<{ day: string; cost_eur: number }>;
  featureCost: Array<{ feature: string; cost_eur: number }>;
  topCompanies: Array<{ company_name: string; cost_eur: number }>;
};

const COLORS = ["#4f46e5", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function OverviewCharts({ dailyCost, featureCost, topCompanies }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Custo diário IA (EUR)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyCost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatEur(Number(value || 0), 2, 4)} />
              <Line type="monotone" dataKey="cost_eur" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Custo por feature">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={featureCost} dataKey="cost_eur" nameKey="feature" cx="50%" cy="50%" outerRadius={90} innerRadius={55}>
                {featureCost.map((entry, index) => (
                  <Cell key={`${entry.feature}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatEur(Number(value || 0), 2, 4)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="xl:col-span-2">
        <ChartCard title="Top 5 empresas por custo IA">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis type="category" dataKey="company_name" width={150} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip formatter={(value: any) => formatEur(Number(value || 0), 2, 4)} />
                <Bar dataKey="cost_eur" fill="#6366f1" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
