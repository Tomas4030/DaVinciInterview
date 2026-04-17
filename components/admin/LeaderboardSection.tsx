"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

interface CandidatoRanking {
  posicao: number;
  nome: string;
  email: string;
  score_geral: number;
  scores_detalhes: {
    [key: string]: number;
  };
  reco: string;
}

interface LeaderboardProps {
  vagaId: string;
  vagaTitulo?: string;
}

function obterCor(score: number): string {
  if (score >= 75) return "text-emerald-700 bg-emerald-50";
  if (score >= 56) return "text-blue-700 bg-blue-50";
  if (score >= 40) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

function obterCluasse(score: number): string {
  if (score >= 75) return "🟢 Excelente";
  if (score >= 56) return "🔵 Aceitar";
  if (score >= 40) return "🟡 Talvez";
  return "🔴 Rejeitar";
}

export default function LeaderboardSection({
  vagaId,
  vagaTitulo = "Vaga",
}: LeaderboardProps) {
  const [ranking, setRanking] = useState<CandidatoRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    string | null
  >(null);

  useEffect(() => {
    carregarLeaderboard();
  }, [vagaId]);

  async function carregarLeaderboard() {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch(withBasePath("/api/analise/comparar-candidatos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaga_id: vagaId }),
      });

      const data = await response.json();

      if (!data.sucesso) {
        setErro(data.erro || "Erro ao carregar leaderboard");
        return;
      }

      setRanking(data.dados.ranking || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErro(msg);
      console.error("Erro ao carregar leaderboard:", err);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando leaderboard...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Erro</p>
        <p className="text-sm mt-1">{erro}</p>
        <button
          onClick={() => carregarLeaderboard()}
          className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Nenhum candidato analisado ainda</p>
      </div>
    );
  }

  const categorias = ranking[0]?.scores_detalhes
    ? Object.keys(ranking[0].scores_detalhes)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-sm text-gray-600 mt-1">{vagaTitulo}</p>
        </div>
        <button
          onClick={() => carregarLeaderboard()}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition"
        >
          ↻ Atualizar
        </button>
      </div>

      {/* Destaques - Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ranking.slice(0, 3).map((candidato) => (
          <div
            key={candidato.email}
            className={`rounded-lg p-4 border-2 ${
              candidato.posicao === 1
                ? "border-yellow-400 bg-yellow-50"
                : candidato.posicao === 2
                  ? "border-gray-400 bg-gray-50"
                  : "border-orange-400 bg-orange-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">
                {candidato.posicao === 1
                  ? "🥇"
                  : candidato.posicao === 2
                    ? "🥈"
                    : "🥉"}
              </span>
              <div>
                <p className="font-bold text-gray-900">{candidato.nome}</p>
                <p className="text-xs text-gray-600">{candidato.email}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Score</span>
                <span className="text-lg font-bold text-blue-600">
                  {candidato.score_geral.toFixed(1)}/100
                </span>
              </div>
              <p
                className={`text-xs font-medium ${obterCor(
                  candidato.score_geral,
                )}`}
              >
                {obterCluasse(candidato.score_geral)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ranking Completo */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 w-12">
                #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">
                Candidato
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">
                Score
              </th>
              {categorias.map((cat) => (
                <th
                  key={cat}
                  className="px-3 py-3 text-center font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-100"
                  onClick={() =>
                    setCategoriaSelecionada(
                      categoriaSelecionada === cat ? null : cat,
                    )
                  }
                >
                  {cat === "comunicacao"
                    ? "Comunicação"
                    : cat === "conhecimentoTecnico"
                      ? "Técnico"
                      : cat === "profundidade"
                        ? "Profundidade"
                        : cat === "clareza"
                          ? "Clareza"
                          : "Estrutura"}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold text-gray-900">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((candidato) => (
              <tr
                key={candidato.email}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 text-center font-bold text-gray-900">
                  {candidato.posicao}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {candidato.nome}
                    </p>
                    <p className="text-xs text-gray-500">{candidato.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg text-blue-600">
                      {candidato.score_geral.toFixed(1)}
                    </span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{
                          width: `${Math.min(candidato.score_geral, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                {categorias.map((cat) => {
                  const valor = candidato.scores_detalhes[cat] || 0;
                  return (
                    <td key={cat} className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${obterCor(
                          valor,
                        )}`}
                      >
                        {valor.toFixed(0)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${obterCor(
                      candidato.score_geral,
                    )}`}
                  >
                    {candidato.reco.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/admin/(protected)/analise/${vagaId}/${candidato.email}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Ver Detalhes →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 uppercase font-semibold">
            Total Candidatos
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {ranking.length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 uppercase font-semibold">
            Aceitar
          </p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {
              ranking.filter((r) => ["aceitar", "excelente"].includes(r.reco))
                .length
            }
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-600 uppercase font-semibold">
            Talvez
          </p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {ranking.filter((r) => r.reco === "talvez").length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-600 uppercase font-semibold">
            Rejeitar
          </p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {ranking.filter((r) => r.reco === "rejeitar").length}
          </p>
        </div>
      </div>
    </div>
  );
}
