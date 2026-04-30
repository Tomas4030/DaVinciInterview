import { redirect } from "next/navigation";
import SuperAdminNav from "@/components/super-admin/SuperAdminNav";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listCompaniesUsageSummary } from "@/lib/queries/super-admins";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value || 0);
}

export default async function SuperAdminCompaniesPage() {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const rows = await listCompaniesUsageSummary();

  return (
    <main className="min-h-screen bg-[var(--c-bg)] p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <SuperAdminNav email={session.email} />

        <section className="card overflow-x-auto p-4">
          <h1 className="mb-4 text-xl font-semibold text-gray-900">Companies AI usage (30d)</h1>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-xs uppercase tracking-[0.08em] text-gray-500">
                <th className="px-2 py-2">Company</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">AI Calls</th>
                <th className="px-2 py-2">Tokens</th>
                <th className="px-2 py-2">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.company_id} className="border-b border-[var(--c-border)]/60">
                  <td className="px-2 py-2">{row.company_name}</td>
                  <td className="px-2 py-2">{row.company_slug}</td>
                  <td className="px-2 py-2">{row.total_calls_30d}</td>
                  <td className="px-2 py-2">{row.total_tokens_30d}</td>
                  <td className="px-2 py-2">{formatUsd(row.total_cost_30d_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
