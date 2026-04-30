"use client";

import { useEffect } from "react";

type Variant = "default" | "destructive" | "success" | "warning";

type AlertPopupProps = {
  message: string;
  variant?: Variant;
  onClose: () => void;
  durationMs?: number;
};

const variantClass: Record<Variant, string> = {
  default: "border-[var(--c-border)] bg-white text-[var(--c-text)]",
  destructive: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export default function AlertPopup({
  message,
  variant = "default",
  onClose,
  durationMs = 4500,
}: AlertPopupProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div className="fixed right-4 top-4 z-[120] w-[min(92vw,380px)]">
      <div
        role="alert"
        className={`relative rounded-lg border px-4 py-3 text-sm shadow-lg ${variantClass[variant]}`}
      >
        <p className="pr-6 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar alerta"
          className="absolute right-3 top-2.5 text-xs opacity-60 transition hover:opacity-100"
        >
          x
        </button>
      </div>
    </div>
  );
}
