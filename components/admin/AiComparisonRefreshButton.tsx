"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

type Props = {
  slug: string;
};

export default function AiComparisonRefreshButton({ slug }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    const confirmed = window.confirm(
      "Deseja mesmo substituir os dados atuais da analise IA e recriar as estatisticas?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/responses/ai-comparacao/rebuild`),
        { method: "POST" },
      );

      if (!response.ok) {
        throw new Error("Falha ao recriar analise IA");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      window.alert("Nao foi possivel recriar os dados da analise IA.");
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
      {loading ? "A recriar..." : "Recriar dados IA"}
    </button>
  );
}
