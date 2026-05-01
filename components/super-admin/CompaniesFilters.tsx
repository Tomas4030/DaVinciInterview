"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryParamUpdater } from "@/lib/use-query-param-updater";

type Props = {
  q: string;
  plan: string;
  minCalls: string;
  minCost: string;
  minTokens: string;
};

export default function CompaniesFilters({
  q,
  plan,
  minCalls,
  minCost,
  minTokens,
}: Props) {
  const { isPending, searchParams, updateParams, replacePath } = useQueryParamUpdater();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(query || plan || minCalls || minCost || minTokens);
  }, [query, plan, minCalls, minCost, minTokens]);

  function updateParam(key: string, value: string) {
    updateParams({ [key]: value }, { resetPage: true });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = searchParams.get("q") || "";
      if (query !== current) {
        updateParam("q", query);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchParams]);

  function clearFilters() {
    replacePath();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)_minmax(160px,0.9fr)_minmax(130px,0.7fr)]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar empresa..."
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
        />
        <select
          defaultValue={plan}
          onChange={(event) => updateParam("plan", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        >
          <option value="">Todos os planos</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <input
          type="number"
          min="0"
          defaultValue={minCalls}
          onChange={(event) => updateParam("minCalls", event.target.value)}
          placeholder="Chamadas min"
          className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          defaultValue={minCost}
          onChange={(event) => updateParam("minCost", event.target.value)}
          placeholder="Custo min EUR"
          className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
        />
        <input
          type="number"
          min="0"
          defaultValue={minTokens}
          onChange={(event) => updateParam("minTokens", event.target.value)}
          placeholder="Tokens min"
          className="h-10 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">{isPending ? "A atualizar..." : " "}</p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>
    </section>
  );
}
