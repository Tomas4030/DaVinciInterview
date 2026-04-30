"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  companyId: string;
  feature: string;
  model: string;
  q: string;
  from: string;
  to: string;
  companies: Array<{ id: string; name: string }>;
  features: string[];
  models: string[];
};

export default function AiUsageFilters(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(props.q);

  useEffect(() => {
    setQuery(props.q);
  }, [props.q]);

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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-3 lg:grid-cols-[1fr,1fr,1fr,1fr,auto,auto]">
        <select
          defaultValue={props.companyId}
          onChange={(event) => updateParam("companyId", event.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
        >
          <option value="">Todas as empresas</option>
          {props.companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>

        <select
          defaultValue={props.feature}
          onChange={(event) => updateParam("feature", event.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
        >
          <option value="">Todas as features</option>
          {props.features.map((feature) => (
            <option key={feature} value={feature}>{feature}</option>
          ))}
        </select>

        <select
          defaultValue={props.model}
          onChange={(event) => updateParam("model", event.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
        >
          <option value="">Todos os modelos</option>
          {props.models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar..."
          className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none"
        />

        <input
          type="date"
          defaultValue={props.from}
          onChange={(event) => updateParam("from", event.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />

        <input
          type="date"
          defaultValue={props.to}
          onChange={(event) => updateParam("to", event.target.value)}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
        />

        <div className="flex items-center gap-1 lg:col-span-2">
          <button onClick={() => applyQuickRange(7)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">7d</button>
          <button onClick={() => applyQuickRange(30)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">30d</button>
          <button onClick={() => applyQuickRange(90)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">90d</button>
        </div>
      </div>

      <p className={`mt-2 text-xs text-slate-500 transition-opacity ${isPending ? "opacity-100" : "opacity-0"}`}>
        A atualizar...
      </p>
    </section>
  );
}
