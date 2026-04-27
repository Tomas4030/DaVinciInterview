"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  slug: string;
  locale?: string;
};

export default function AiComparisonRefreshButton({ slug, locale = "en" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    const confirmed = window.confirm(
      tAdmin(locale, "aiComparison.refreshConfirm"),
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/responses/ai-comparacao/rebuild`),
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error(tAdmin(locale, "aiComparison.refreshError"));
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      window.alert(tAdmin(locale, "aiComparison.refreshError"));
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
