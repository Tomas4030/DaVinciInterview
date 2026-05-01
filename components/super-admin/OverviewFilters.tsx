"use client";

import { useQueryParamUpdater } from "@/lib/use-query-param-updater";

type Props = {
  from: string;
  to: string;
  granularity: "daily" | "monthly" | "yearly";
};

export default function OverviewFilters({ from, to, granularity }: Props) {
  const { isPending, updateParams } = useQueryParamUpdater();

  function updateParam(key: string, value: string) {
    updateParams({ [key]: value });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="date"
          name="from"
          defaultValue={from}
          onChange={(event) => updateParam("from", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          onChange={(event) => updateParam("to", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        />
        <select
          name="granularity"
          defaultValue={granularity}
          onChange={(event) => updateParam("granularity", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        >
          <option value="daily">Diario</option>
          <option value="monthly">Mensal</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      <p
        aria-live="polite"
        className="mt-3 text-xs text-slate-400"
      >
        {isPending ? "A atualizar..." : " "}
      </p>
    </section>
  );
}
