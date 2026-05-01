"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  companyId: string;
  feature: string;
  model: string;
  from: string;
  to: string;
  q: string;
};

type ExportFormat = "xlsx" | "csv" | "pdf" | "json";

const OPTIONS: Array<{ format: ExportFormat; label: string; icon: string }> = [
  { format: "xlsx", label: "Excel (.xlsx)", icon: "▦" },
  { format: "csv", label: "CSV (.csv)", icon: "◫" },
  { format: "pdf", label: "PDF relatorio", icon: "◪" },
  { format: "json", label: "JSON tecnico", icon: "{}" },
];

export default function AiUsageExportDropdown(props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function buildHref(format: ExportFormat): string {
    const params = new URLSearchParams({
      format,
      companyId: props.companyId,
      feature: props.feature,
      model: props.model,
      from: props.from,
      to: props.to,
      q: props.q,
    });

    return `/api/super-admin/export-ai-usage?${params.toString()}`;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      >
        Exportar
        <span className="text-xs text-slate-500">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          {OPTIONS.map((option) => (
            <a
              key={option.format}
              href={buildHref(option.format)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="w-4 text-center text-[11px] text-slate-400">{option.icon}</span>
              {option.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
