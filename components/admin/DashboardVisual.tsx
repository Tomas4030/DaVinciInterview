"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AnalisisResultado } from "@/lib/analysis-engine";

interface DashboardProps {
  vagaId: string;
  sessaoId?: string;
  emailCandidato?: string;
}

function gerarGraficoRadar(scores: Record<string, number>): string {
  // SVG Radar Chart simples (5 categorias)
  const tamanho = 200;
  const centro = tamanho / 2;
  const raio = 80;

  const categorias = [
    "Comunicação",
    "Técnico",
    "Profundidade",
    "Clareza",
    "Estrutura",
  ];
  const chaves = [
    "comunicacao",
    "conhecimentoTecnico",
    "profundidade",
    "clareza",
    "estruturacao",
  ];
  const valores = chaves.map((k) => scores[k] || 0);

  const angulo = (Math.PI * 2) / 5;
  const pontos = valores.map((v, i) => {
    const ang = angulo * i - Math.PI / 2;
    const x = centro + ((raio * v) / 100) * Math.cos(ang);
    const y = centro + ((raio * v) / 100) * Math.sin(ang);
    return `${x},${y}`;
  });

  return `
    <svg width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}" style="max-width: 100%; height: auto;">
      <!-- Grid -->
      ${[20, 40, 60, 80, 100]
        .map((pct) => {
          const pt = valores.map((_, i) => {
            const ang = angulo * i - Math.PI / 2;
            const x = centro + ((raio * pct) / 100) * Math.cos(ang);
            const y = centro + ((raio * pct) / 100) * Math.sin(ang);
            return `${x},${y}`;
          });
          return `<polygon points="${pt.join(" ")}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
        })
        .join("")}
      
      <!-- Eixos -->
      ${valores
        .map((_, i) => {
          const ang = angulo * i - Math.PI / 2;
          const x = centro + raio * Math.cos(ang);
          const y = centro + raio * Math.sin(ang);
          return `<line x1="${centro}" y1="${centro}" x2="${x}" y2="${y}" stroke="#d1d5db" stroke-width="1"/>`;
        })
        .join("")}
      
      <!-- Dados -->
      <polygon points="${pontos.join(" ")}" fill="#3b82f6" fill-opacity="0.3" stroke="#3b82f6" stroke-width="2"/>
      
      <!-- Pontos -->
      ${pontos
        .map((pt) => {
          const [x, y] = pt.split(",").map(Number);
          return `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6"/>`;
        })
        .join("")}
      
      <!-- Labels -->
      ${categorias
        .map((cat, i) => {
          const ang = angulo * i - Math.PI / 2;
          const x = centro + (raio + 30) * Math.cos(ang);
          const y = centro + (raio + 30) * Math.sin(ang);
          return `
          <text 
            x="${x}" y="${y}" 
            text-anchor="middle" 
            font-size="11" 
            font-weight="600"
            fill="#374151"
          >
            ${cat}
          </text>
        `;
        })
        .join("")}
    </svg>
  `;
}

export default function DashboardVisual({
  vagaId,
  sessaoId,
  emailCandidato,
}: DashboardProps) {
  const [analisis, setAnalisis] = useState<AnalisisResultado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (sessaoId) {
      carregarAnalisis();
    }
  }, [sessaoId]);

  async function carregarAnalisis() {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch("/api/analise/gerar-resumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessao_id: sessaoId,
          vaga_id: vagaId,
          vagaTitulo: "Vaga",
          emailCandidato,
        }),
      });

      const data = await response.json();

      if (!data.sucesso) {
        setErro(data.erro || "Erro ao carregar análise");
        return;
      }

      setAnalisis(data.dados);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  async function exportarPDF() {
    setExportando(true);

    try {
      const response = await fetch("/api/exportar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "candidato",
          sessao_id: sessaoId,
          vaga_id: vagaId,
          vagaTitulo: "Vaga",
          emailCandidato,
        }),
      });

      const data = await response.json();

      if (data.sucesso && data.html) {
        // Usar html2pdf se disponível, senão fazer download como HTML
        const link = document.createElement("a");
        const blob = new Blob([data.html], { type: "text/html" });
        link.href = URL.createObjectURL(blob);
        link.download = data.nomeArquivo || "analise.html";
        link.click();
      } else {
        alert("Erro ao exportar: " + (data.erro || "Erro desconhecido"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Erro ao exportar: " + msg);
    } finally {
      setExportando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando análise...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Erro</p>
        <p className="text-sm mt-1">{erro}</p>
      </div>
    );
  }

  if (!analisis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Nenhuma análise disponível</p>
      </div>
    );
  }

  const gerarCor = (score: number): string => {
    if (score >= 75) return "text-green-700 bg-green-50 border-green-200";
    if (score >= 56) return "text-blue-700 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard de Resultados
        </h2>
        <button
          onClick={() => exportarPDF()}
          disabled={exportando}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium transition"
        >
          {exportando ? "Exportando..." : "📥 Exportar PDF"}
        </button>
      </div>

      {/* Score Principal */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">Pontuação Geral</p>
            <p className="text-5xl font-bold">
              {analisis.scores.media.toFixed(1)}
            </p>
            <p className="text-blue-100 mt-2">de 100 pontos</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold mb-2">Recomendação</p>
            <p className="text-2xl font-bold">
              {analisis.recomendacao_geral.toUpperCase()}
            </p>
            <p className="text-blue-100 text-sm mt-2 text-right max-w-xs">
              {analisis.justificacao_recomendacao}
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Radar */}
        <div
          className={`border rounded-lg p-6 ${gerarCor(analisis.scores.media)}`}
        >
          <h3 className="font-semibold mb-4 text-gray-900">
            Scores por Categoria
          </h3>
          <div className="flex justify-center">
            <div
              dangerouslySetInnerHTML={{
                __html: gerarGraficoRadar(
                  analisis.scores as unknown as Record<string, number>,
                ),
              }}
            />
          </div>
        </div>

        {/* Cards de Scores */}
        <div className="space-y-3">
          {[
            { nome: "Comunicação", chave: "comunicacao" },
            { nome: "Conhecimento Técnico", chave: "conhecimentoTecnico" },
            { nome: "Profundidade", chave: "profundidade" },
            { nome: "Clareza", chave: "clareza" },
            { nome: "Estruturação", chave: "estruturacao" },
          ].map((cat) => {
            const score =
              analisis.scores[cat.chave as keyof typeof analisis.scores] || 0;
            return (
              <div
                key={cat.chave}
                className={`border rounded-lg p-3 ${gerarCor(score as number)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{cat.nome}</span>
                  <span className="font-bold text-lg">
                    {(score as number).toFixed(0)}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: `${Math.min(score as number, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo Executivo</h3>
        <p className="text-gray-700 leading-relaxed">
          {analisis.resumo_executivo}
        </p>
      </div>

      {/* Pontos Fortes e Fracos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-green-200 rounded-lg p-6 bg-green-50">
          <h3 className="font-semibold text-green-900 mb-4">✓ Pontos Fortes</h3>
          <ul className="space-y-2">
            {analisis.pontos_fortes.map((ponto, idx) => (
              <li key={idx} className="flex gap-2 text-green-800">
                <span className="text-green-600 font-bold">•</span>
                <span>{ponto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <h3 className="font-semibold text-red-900 mb-4">✗ Pontos Fracos</h3>
          <ul className="space-y-2">
            {analisis.pontos_fracos.map((ponto, idx) => (
              <li key={idx} className="flex gap-2 text-red-800">
                <span className="text-red-600 font-bold">•</span>
                <span>{ponto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sugestões de Melhoria */}
      <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-4">
          💡 Sugestões de Melhoria
        </h3>
        <ol className="space-y-3">
          {analisis.sugestoes_melhoria.map((sugestao, idx) => (
            <li key={idx} className="flex gap-3 text-blue-800">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <span>{sugestao}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Ações */}
      <div className="flex gap-4">
        <button
          onClick={() => window.print()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={() => exportarPDF()}
          disabled={exportando}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
        >
          {exportando ? "Exportando..." : "📥 Exportar PDF"}
        </button>
      </div>
    </div>
  );
}
