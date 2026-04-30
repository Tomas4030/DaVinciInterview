"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  q: string;
  from: string;
  to: string;
};

export default function CompaniesFilters({ q, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const today = useMemo(() => new Date(), []);

  function formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  function applyQuickRange(days: number) {
    const toDate = new Date(today);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days);
    updateParam("from", formatDate(fromDate));
    updateParam("to", formatDate(toDate));
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquisar empresa..."
        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
      />
      <input
        type="date"
        defaultValue={from}
        onChange={(event) => updateParam("from", event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
      />
      <input
        type="date"
        defaultValue={to}
        onChange={(event) => updateParam("to", event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
      />
      <div className="flex items-center gap-1">
        <button onClick={() => applyQuickRange(7)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">7d</button>
        <button onClick={() => applyQuickRange(30)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">30d</button>
        <button onClick={() => applyQuickRange(90)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">90d</button>
      </div>
      <span className={`text-xs text-slate-500 transition-opacity ${isPending ? "opacity-100" : "opacity-0"}`}>
        A atualizar...
      </span>
    </div>
  );
}
