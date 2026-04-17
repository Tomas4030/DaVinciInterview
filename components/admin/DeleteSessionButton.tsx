// components/admin/DeleteSessionButton.tsx
"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/base-path";

interface DeleteSessionButtonProps {
  email: string;
  vagaId: string;
}

export default function DeleteSessionButton({
  email,
  vagaId,
}: DeleteSessionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(
        withBasePath("/api/candidato-respostas/delete-by-email"),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            vagaId,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Erro ao apagar respostas");
        return;
      }

      alert("Respostas apagadas com sucesso");
      setShowConfirm(false);

      // Recarregar página
      window.location.reload();
    } catch (error) {
      console.error("Erro ao apagar:", error);
      alert("Erro ao apagar respostas");
    } finally {
      setIsDeleting(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {isDeleting ? "A apagar..." : "Confirmar"}
        </button>

        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-500/10 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Apagar respostas
    </button>
  );
}
