"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type Props = {
  slug: string;
  interviewId: string;
};

export default function DeleteInterviewButton({ slug, interviewId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Tens a certeza que queres apagar esta entrevista? Esta ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        withBasePath(`/api/companies/${slug}/interviews/${interviewId}`),
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data?.error || "Não foi possível apagar a entrevista.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Erro ao apagar entrevista.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "A apagar..." : "Apagar"}
    </button>
  );
}
