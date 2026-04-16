// app/api/exportar/pdf/route.ts
/**
 * POST /api/exportar/pdf
 *
 * Gera PDF com resultados de análise de entrevista
 * Retorna HTML estruturado para download via html2pdf.js
 */

import { NextRequest, NextResponse } from "next/server";
import { gerarHTMLCandidato } from "@/lib/pdf-export";
import { AnalisisResultado } from "@/lib/analysis-engine";
import {
  buscarAnalisePorSessao,
  listarAnalisesVaga,
} from "@/lib/queries/analises";
import { jsonParse } from "@/lib/db";

export interface ExportarPDFRequest {
  tipo: "candidato" | "comparacao";
  sessao_id?: string;
  vaga_id: string;
  vagaTitulo: string;
  emailCandidato?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportarPDFRequest = await request.json();
    const { tipo, sessao_id, vaga_id, vagaTitulo, emailCandidato } = body;

    if (!tipo || !vaga_id || !vagaTitulo) {
      return NextResponse.json(
        { sucesso: false, erro: "tipo, vaga_id e vagaTitulo são obrigatórios" },
        { status: 400 },
      );
    }

    if (tipo === "candidato") {
      if (!sessao_id) {
        return NextResponse.json(
          {
            sucesso: false,
            erro: "sessao_id é obrigatório para tipo candidato",
          },
          { status: 400 },
        );
      }

      // Obter análise guardada
      const analise = await buscarAnalisePorSessao(sessao_id);

      if (!analise) {
        return NextResponse.json(
          {
            sucesso: false,
            erro: "Análise não encontrada para esta sessão",
          },
          { status: 404 },
        );
      }

      const html = gerarHTMLCandidato(
        {
          vagaTitulo,
          candidatoEmail: emailCandidato,
          dataEntrevista: new Date().toISOString(),
          formato: "candidato",
        },
        analise.analisis_json as AnalisisResultado,
      );

      return NextResponse.json(
        {
          sucesso: true,
          mensagem: "HTML gerado para PDF",
          html,
          nomeArquivo: `analise_${emailCandidato || "candidato"}_${new Date().getTime()}.html`,
        },
        { status: 200 },
      );
    } else if (tipo === "comparacao") {
      // Para comparação, retornar comparação formatada
      const analises = await listarAnalisesVaga(vaga_id);

      if (!analises || analises.length === 0) {
        return NextResponse.json(
          {
            sucesso: false,
            erro: "Nenhuma análise encontrada para esta vaga",
          },
          { status: 404 },
        );
      }

      // Gerar HTML com comparação (simplificado para agora)
      const htmlComparacao = gerarHTMLComparacao(
        vagaTitulo,
        analises.map((a) => a.analisis_json),
      );

      return NextResponse.json(
        {
          sucesso: true,
          mensagem: "Comparação gerada para PDF",
          html: htmlComparacao,
          nomeArquivo: `comparacao_${vagaTitulo}_${new Date().getTime()}.html`,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { sucesso: false, erro: "Tipo inválido" },
        { status: 400 },
      );
    }
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/exportar/pdf]", err);

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status: 500 },
    );
  }
}

/**
 * Gerar HTML para comparação de candidatos
 */
function gerarHTMLComparacao(
  vagaTitulo: string,
  analises: AnalisisResultado[],
): string {
  const dataFormatada = new Date().toLocaleDateString("pt-PT");

  const linhasTabela = analises
    .map((a, idx) => {
      const corRecomendacao =
        a?.recomendacao_geral === "excelente" ||
        a.recomendacao_geral === "aceitar"
          ? "#10b981"
          : a.recomendacao_geral === "talvez"
            ? "#f59e0b"
            : "#ef4444";

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 15px; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 15px;">${a.candidato || "Candidato"}</td>
          <td style="padding: 15px; text-align: center; font-weight: bold; font-size: 18px; color: #3b82f6;">${a.scores.media.toFixed(1)}</td>
          <td style="padding: 15px; text-align: center;">${a.scores.comunicacao.toFixed(0)}</td>
          <td style="padding: 15px; text-align: center;">${a.scores.conhecimentoTecnico.toFixed(0)}</td>
          <td style="padding: 15px; text-align: center;">${a.scores.profundidade.toFixed(0)}</td>
          <td style="padding: 15px; text-align: center;">
            <span style="
              display: inline-block;
              padding: 5px 10px;
              background: ${corRecomendacao}20;
              color: ${corRecomendacao};
              border-radius: 4px;
              font-weight: 600;
              font-size: 12px;
            ">
              ${a.recomendacao_geral.toUpperCase()}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comparação Entrevistas - ${vagaTitulo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .header h1 { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 10px; }
        .header p { color: #6b7280; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          background: #f3f4f6;
          border-bottom: 2px solid #e5e7eb;
          color: #111827;
        }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Comparação de Candidatos</h1>
          <p>Vaga: <strong>${vagaTitulo}</strong></p>
          <p>Data: <strong>${dataFormatada}</strong></p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Candidato</th>
              <th style="width: 80px;">Score</th>
              <th style="width: 80px;">Comunicação</th>
              <th style="width: 100px;">Técnico</th>
              <th style="width: 100px;">Profundidade</th>
              <th style="width: 100px;">Recomendação</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>

        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema Chat2Work</p>
          <p>© 2026 - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
