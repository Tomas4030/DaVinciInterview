import { redirect } from "next/navigation";
import SuperAdminNav from "@/components/super-admin/SuperAdminNav";
import { getSuperAdminSessionFromServerCookies } from "@/lib/super-admin-context";
import { listAiUsageLogs } from "@/lib/queries/super-admins";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0);
}

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
  };
};

export default async function SuperAdminAiUsagePage({ searchParams }: Props) {
  const session = getSuperAdminSessionFromServerCookies();
  if (!session) redirect("/super-admin/login");

  const rows = await listAiUsageLogs({
    companyId: searchParams?.companyId,
    model: searchParams?.model,
    feature: searchParams?.feature,
    from: searchParams?.from,
    to: searchParams?.to,
    limit: 200,
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.calls += 1;
      acc.prompt += Number(row.prompt_tokens || 0);
      acc.completion += Number(row.completion_tokens || 0);
      acc.total += Number(row.total_tokens || 0);
      acc.cost += Number(row.cost_usd || 0);
      return acc;
    },
    { calls: 0, prompt: 0, completion: 0, total: 0, cost: 0 },
  );

  return (
    <main className="min-h-screen bg-[var(--c-bg)] p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <SuperAdminNav email={session.email} />

        <section className="card overflow-x-auto p-4">
          <h1 className="mb-4 text-xl font-semibold text-gray-900">AI usage logs</h1>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <article className="rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-xs text-gray-500">Calls</p>
              <p className="text-lg font-semibold">{totals.calls}</p>
            </article>
            <article className="rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-xs text-gray-500">Prompt tokens</p>
              <p className="text-lg font-semibold">{totals.prompt}</p>
            </article>
            <article className="rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-xs text-gray-500">Completion tokens</p>
              <p className="text-lg font-semibold">{totals.completion}</p>
            </article>
            <article className="rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-xs text-gray-500">Total tokens</p>
              <p className="text-lg font-semibold">{totals.total}</p>
            </article>
            <article className="rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-xs text-gray-500">Total cost</p>
              <p className="text-lg font-semibold">{formatUsd(totals.cost)}</p>
            </article>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--c-border)] text-xs uppercase tracking-[0.08em] text-gray-500">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Company</th>
                <th className="px-2 py-2">Feature</th>
                <th className="px-2 py-2">Model</th>
                <th className="px-2 py-2">Prompt</th>
                <th className="px-2 py-2">Completion</th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--c-border)]/60">
                  <td className="px-2 py-2">{formatDateTime(row.created_at)}</td>
                  <td className="px-2 py-2">{row.company_name || "-"}</td>
                  <td className="px-2 py-2">{row.feature}</td>
                  <td className="px-2 py-2">{row.model}</td>
                  <td className="px-2 py-2">{row.prompt_tokens}</td>
                  <td className="px-2 py-2">{row.completion_tokens}</td>
                  <td className="px-2 py-2">{row.total_tokens}</td>
                  <td className="px-2 py-2">{formatUsd(row.cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
