"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  slug: string;
  locale?: string;
};

export default function AiComparisonRefreshButton({ slug, locale = "en" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRefresh() {
    const confirmed = window.confirm(
      tAdmin(locale, "aiComparison.refreshConfirm"),
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/responses/ai-comparacao/rebuild`),
        { method: "POST" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const rawError = String(data?.error || "").toLowerCase();
        if (rawError.includes("comparacao ia disponivel apenas no plano pro")) {
          throw new Error(tAdmin(locale, "aiComparison.limitProOnly"));
        }
        throw new Error(tAdmin(locale, "aiComparison.refreshError"));
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError(tAdmin(locale, "aiComparison.refreshError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="inline-flex h-8 items-center rounded-lg bg-[var(--c-brand)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--c-brand-dark)] disabled:opacity-60"
      >
        {loading
          ? tAdmin(locale, "aiComparison.refreshLoading")
          : tAdmin(locale, "aiComparison.refreshAction")}
      </button>
    </div>
  );
}
