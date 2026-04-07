// app/admin/(protected)/respostas/page.tsx
import { listarSessoes, obterVaga, listarVagas } from "@/lib/api";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Respostas" };

interface Props {
  searchParams: { vaga?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RespostasPage({ searchParams }: Props) {
  const vagaFiltro = searchParams.vaga;

  let sessoes: Awaited<ReturnType<typeof listarSessoes>> = [];
  let vaga = vagaFiltro ? await obterVaga(vagaFiltro).catch(() => null) : null;
  let todasVagas: Awaited<ReturnType<typeof listarVagas>> = [];

  try {
    sessoes = await listarSessoes(vagaFiltro);
  } catch {}
  try {
    todasVagas = await listarVagas();
  } catch {}

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Respostas {vaga ? `— ${vaga.titulo}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {sessoes.length} sessão{sessoes.length !== 1 ? "ões" : ""}{" "}
            encontrada{sessoes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin" className="btn-ghost text-sm">
          ← Dashboard
        </Link>
      </div>

      {/* Filtro por vaga */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/respostas"
          className={`tag text-xs py-1 px-3 transition-colors ${
            !vagaFiltro
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todas
        </Link>
        {todasVagas.map((v) => (
          <Link
            key={v.id}
            href={`/admin/respostas?vaga=${v.id}`}
            className={`tag text-xs py-1 px-3 transition-colors ${
              vagaFiltro === v.id
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {v.titulo}
          </Link>
        ))}
      </div>

      {/* Lista de sessões */}
      {sessoes.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-gray-400">Nenhuma resposta recebida ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessoes.map((sessao, i) => {
            // Encontra a vaga correspondente para obter as perguntas
            const vagaSessao = todasVagas.find((v) => v.id === sessao.vaga_id);

            return (
              <details
                key={sessao.sessao_id}
                className="card overflow-hidden group"
              >
                <summary className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/60 transition-colors list-none">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {vagaSessao?.titulo ?? sessao.vaga_id}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {sessao.sessao_id}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {formatDate(sessao.criada_em)}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {sessao.respostas.length} resposta
                      {sessao.respostas.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-gray-300 group-open:rotate-180 transition-transform ml-1 text-xs">
                    ▼
                  </span>
                </summary>

                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {sessao.respostas
                    .sort((a, b) => a.pergunta_id - b.pergunta_id)
                    .map((resp) => {
                      // Tenta encontrar o texto da pergunta
                      const pergunta =
                        (vaga?.perguntas ?? []).find(
                          (p) => p.id === resp.pergunta_id,
                        ) ?? vagaSessao?.["perguntas" as never];

                      return (
                        <div key={resp.id} className="px-5 py-4">
                          <p className="text-xs font-medium text-gray-400 mb-1.5">
                            Pergunta {resp.pergunta_id}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {resp.resposta}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
