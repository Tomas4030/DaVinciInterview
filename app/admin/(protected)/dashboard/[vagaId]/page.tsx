// app/admin/(protected)/dashboard/[vagaId]/page.tsx
/**
 * Página de Dashboard Visual de Resultados
 */

import { redirect } from "next/navigation";
import DashboardVisual from "@/components/admin/DashboardVisual";
import { criarClienteSupabase } from "@/lib/supabase-server";

async function obterVagaTitulo(vagaId: string): Promise<string> {
  try {
    const supabase = await criarClienteSupabase();
    const { data } = await supabase
      .from("vagas")
      .select("titulo")
      .eq("id", vagaId)
      .single();

    return (data as any)?.titulo || vagaId;
  } catch {
    return vagaId;
  }
}

export default async function DashboardPage({
  params: { vagaId },
  searchParams,
}: {
  params: { vagaId: string };
  searchParams: { sessaoId?: string; email?: string };
}) {
  if (!vagaId) {
    redirect("/admin/(protected)/vagas");
  }

  const vagaTitulo = await obterVagaTitulo(vagaId);
  const sessaoId = searchParams.sessaoId;
  const emailCandidato = searchParams.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard de Resultados
              </h1>
              <p className="text-gray-600 mt-1">
                Vaga: <strong>{vagaTitulo}</strong>
              </p>
              {emailCandidato && (
                <p className="text-gray-600 text-sm mt-1">
                  Candidato: <strong>{emailCandidato}</strong>
                </p>
              )}
            </div>
            <a
              href={`/admin/(protected)/leaderboard/${vagaId}`}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Ver Leaderboard →
            </a>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessaoId ? (
          <DashboardVisual
            vagaId={vagaId}
            sessaoId={sessaoId}
            emailCandidato={emailCandidato}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
            <p className="font-semibold">Parâmetro sessaoId não fornecido</p>
            <p className="text-sm mt-1">
              Acesse esta página através do leaderboard ou com URL como:
              <code className="block mt-2 bg-yellow-100 p-2 rounded text-xs">
                /admin/(protected)/dashboard/[vagaId]?sessaoId=...&email=...
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
