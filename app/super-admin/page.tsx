import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSuperAdminDashboardStats } from "@/lib/queries/super-admins";
import {
  SUPER_ADMIN_SESSION_COOKIE,
  parseSuperAdminToken,
} from "@/lib/super-admin-auth";
import SuperAdminNav from "@/components/super-admin/SuperAdminNav";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value || 0);
}

export default async function SuperAdminDashboardPage() {
  const token = cookies().get(SUPER_ADMIN_SESSION_COOKIE)?.value;
  const session = parseSuperAdminToken(token);

  if (!session) {
    redirect("/super-admin/login");
  }

  const stats = await getSuperAdminDashboardStats();

  return (
    <main className="min-h-screen bg-[var(--c-bg)] p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="card p-5">
          <SuperAdminNav email={session.email} />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Global Platform Overview</h1>
          <p className="mt-2 text-sm text-gray-600">Core KPIs for companies and AI operations.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="card p-5">
            <p className="text-xs text-gray-500">Companies</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.totalCompanies}</p>
          </article>

          <article className="card p-5">
            <p className="text-xs text-gray-500">Company Admins</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.totalCompanyAdmins}</p>
          </article>

          <article className="card p-5">
            <p className="text-xs text-gray-500">AI Calls (30d)</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.aiCallsLast30d}</p>
          </article>

          <article className="card p-5">
            <p className="text-xs text-gray-500">AI Cost (30d)</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatUsd(stats.aiCostLast30dUsd)}</p>
          </article>
        </section>
      </div>
    </main>
  );
}
