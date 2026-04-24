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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  async function handleConfirmDelete() {
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

      setShowConfirmModal(false);
      router.refresh();
    } catch {
      window.alert("Erro ao apagar entrevista.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "A apagar..." : "Apagar"}
      </button>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-white p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-[var(--c-text)]">
              Confirmar remoção
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--c-muted)]">
              Ao confirmar, vais apagar esta vaga/entrevista e também todas as
              respostas e análises IA associadas. Esta ação é permanente.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)] disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="rounded-lg border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "A apagar..." : "Confirmar e apagar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
