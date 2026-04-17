// app/admin/(protected)/leaderboard/[vagaId]/page.tsx
/**
 * Página de Leaderboard
 * Mostra ranking de candidatos para uma vaga específica
 */

import { redirect } from "next/navigation";
import LeaderboardSection from "@/components/admin/LeaderboardSection";
import { obterVaga } from "@/lib/api";

async function obterVagaTitulo(vagaId: string): Promise<string> {
  try {
    const vaga = await obterVaga(vagaId);
    return vaga.titulo || vagaId;
  } catch (error) {
    console.error("[obterVagaTitulo]", error);
    return vagaId;
  }
}

export default async function LeaderboardPage({
  params: { vagaId },
}: {
  params: { vagaId: string };
}) {
  if (!vagaId) {
    redirect("/admin");
  }

  const vagaTitulo = await obterVagaTitulo(vagaId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ranking de Candidatos
              </h1>
              <p className="text-gray-600 mt-1">
                Vaga: <strong>{vagaTitulo}</strong>
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Voltar às Vagas
            </a>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LeaderboardSection vagaId={vagaId} vagaTitulo={vagaTitulo} />
      </div>
    </div>
  );
}
