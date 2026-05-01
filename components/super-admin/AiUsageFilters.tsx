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

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      props.companyId || props.feature || props.model || props.q || props.from || props.to,
    );
  }, [props.companyId, props.feature, props.model, props.q, props.from, props.to]);

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

  function clearFilters() {
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <select
          defaultValue={props.companyId}
          onChange={(event) => updateParam("companyId", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        >
          <option value="">Todas as empresas</option>
          {props.companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>

        <select
          defaultValue={props.feature}
          onChange={(event) => updateParam("feature", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        >
          <option value="">Todas as features</option>
          {props.features.map((feature) => (
            <option key={feature} value={feature}>{feature}</option>
          ))}
        </select>

        <select
          defaultValue={props.model}
          onChange={(event) => updateParam("model", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
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
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        />

        <input
          type="date"
          defaultValue={props.from}
          onChange={(event) => updateParam("from", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
        />

        <input
          type="date"
          defaultValue={props.to}
          onChange={(event) => updateParam("to", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
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
