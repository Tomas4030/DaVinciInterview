"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  from: string;
  to: string;
  granularity: "daily" | "monthly" | "yearly";
};

export default function OverviewFilters({ from, to, granularity }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        name="from"
        defaultValue={from}
        onChange={(event) => updateParam("from", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
      />
      <input
        type="date"
        name="to"
        defaultValue={to}
        onChange={(event) => updateParam("to", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
      />
      <select
        name="granularity"
        defaultValue={granularity}
        onChange={(event) => updateParam("granularity", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
      >
        <option value="daily">Diario</option>
        <option value="monthly">Mensal</option>
        <option value="yearly">Anual</option>
      </select>

      <span
        aria-live="polite"
        className={`text-xs font-medium text-[#787774] transition-opacity ${isPending ? "opacity-100" : "opacity-0"}`}
      >
        A atualizar...
      </span>
    </div>
  );
}
