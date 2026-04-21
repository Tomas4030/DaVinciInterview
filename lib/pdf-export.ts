/**
 * PDF Export Helper
 * Gera PDFs structure com resultados de entrevistas
 */

import { AnalisisResultado } from "./analysis-engine";

export interface PDFConfig {
  vagaTitulo: string;
  candidatoEmail?: string;
  dataEntrevista: string;
  formato: "candidato" | "comparacao";
}

/**
 * Gerar HTML estruturado para PDF (candidato individual)
 */
export function gerarHTMLCandidato(
  config: PDFConfig,
  analisis: AnalisisResultado,
): string {
  const dataFormatada = new Date(analisis.data_analise).toLocaleDateString(
    "pt-PT",
  );

  const gerarBarraScore = (score: number): string => {
    const percentual = Math.min(score, 100);
    const corFundo =
      score >= 75
        ? "#10b981"
        : score >= 56
          ? "#3b82f6"
          : score >= 40
            ? "#f59e0b"
            : "#ef4444";

    return `
      <div style="margin: 10px 0; border-radius: 4px; overflow: hidden; background: #e5e7eb; height: 24px;">
        <div style="
          width: ${percentual}%;
          height: 100%;
          background-color: ${corFundo};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          transition: width 0.3s ease;
        ">
          ${percentual > 10 ? Math.round(percentual) + "%" : ""}
        </div>
      </div>
    `;
  };

  const gerarScores = (): string => {
    const categorias = [
      { nome: "Comunicação", chave: "comunicacao" },
      { nome: "Conhecimento Técnico", chave: "conhecimentoTecnico" },
      { nome: "Profundidade", chave: "profundidade" },
      { nome: "Clareza", chave: "clareza" },
      { nome: "Estruturação", chave: "estruturacao" },
    ];

    return categorias
      .map((cat) => {
        const score =
          analisis.scores[cat.chave as keyof typeof analisis.scores];
        return `
          <div style="margin-bottom: 20px; padding: 0 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1f2937;">${cat.nome}</span>
              <span style="font-weight: bold; font-size: 16px; color: #3b82f6;">${score}/100</span>
            </div>
            ${gerarBarraScore(score as number)}
          </div>
        `;
      })
      .join("");
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Análise Entrevista - ${config.vagaTitulo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .header h1 { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 10px; }
        .header p { color: #6b7280; font-size: 14px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
        .info-item { }
        .info-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: 600; color: #111827; }
        .score-section { margin: 40px 0; }
        .score-section h2 { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        .main-score { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; margin-bottom: 20px; }
        .main-score-number { font-size: 64px; font-weight: bold; }
        .main-score-label { font-size: 14px; margin-top: 10px; opacity: 0.9; }
        .recommendation { 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
          font-weight: 600;
        }
        .recommendation.accept { background: #d1fae5; color: #047857; border-left: 4px solid #10b981; }
        .recommendation.maybe { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }
        .recommendation.reject { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }
        .recommendation.excellent { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
        .strengths, .weaknesses, .improvements { margin: 30px 0; }
        .strengths h3, .weaknesses h3, .improvements h3 { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
        .list-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-left: 3px solid #3b82f6; padding-left: 15px; border-radius: 4px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Análise de Entrevista</h1>
          <p>Vaga: <strong>${config.vagaTitulo}</strong></p>
        </div>

        <!-- Informações -->
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Candidato</div>
            <div class="info-value">${config.candidatoEmail || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data da Análise</div>
            <div class="info-value">${dataFormatada}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total de Perguntas</div>
            <div class="info-value">${analisis.total_perguntas}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Recomendação</div>
            <div class="info-value">${analisis.recomendacao_geral.toUpperCase()}</div>
          </div>
        </div>

        <!-- Score Principal -->
        <div class="score-section">
          <div class="main-score">
            <div class="main-score-number">${analisis.scores.media.toFixed(1)}</div>
            <div class="main-score-label">PONTUAÇÃO GERAL</div>
          </div>

          <!-- Recomendação -->
          <div class="recommendation ${
            analisis.recomendacao_geral === "excelente" ||
            analisis.recomendacao_geral === "aceitar"
              ? "accept"
              : analisis.recomendacao_geral === "talvez"
                ? "maybe"
                : analisis.recomendacao_geral === "rejeitar"
                  ? "reject"
                  : "excellent"
          }">
            <strong>Recomendação:</strong> ${analisis.justificacao_recomendacao}
          </div>

          <!-- Resumo -->
          <p style="margin: 20px 0; line-height: 1.8; color: #4b5563;">
            <strong>Resumo Executivo:</strong> ${analisis.resumo_executivo}
          </p>
        </div>

        <!-- Scores por Categoria -->
        <div class="score-section">
          <h2>Scores Detalhados</h2>
          ${gerarScores()}
        </div>

        <!-- Pontos Fortes -->
        <div class="strengths">
          <h3>✓ Pontos Fortes</h3>
          ${analisis.pontos_fortes.map((p) => `<div class="list-item">${p}</div>`).join("")}
        </div>

        <!-- Pontos Fracos -->
        <div class="weaknesses">
          <h3>✗ Pontos Fracos</h3>
          ${analisis.pontos_fracos.map((p) => `<div class="list-item">${p}</div>`).join("")}
        </div>

        <!-- Sugestões de Melhoria -->
        <div class="improvements">
          <h3>💡 Sugestões de Melhoria</h3>
          ${analisis.sugestoes_melhoria.map((s, idx) => `<div class="list-item"><strong>${idx + 1}.</strong> ${s}</div>`).join("")}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema MatchWorky</p>
          <p>© 2026 - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Converter HTML para PDF (usando fetch para external service ou local)
 * Requer serviço de conversão como html2pdf.js no cliente ou puppeteer no servidor
 */
export async function htmlParaPDF(
  html: string,
  nomeArquivo: string,
): Promise<Blob | null> {
  try {
    // Opção 1: Usar html2pdf.js no cliente (requer biblioteca)
    // Opção 2: Usar API externa de conversão
    // Opção 3: Usar node-pdfkit no servidor

    // Para agora, retornar null e deixar para implementação com puppeteer
    console.warn(
      "PDF conversion requires external service setup (puppeteer, html2pdf, etc)",
    );
    return null;
  } catch (err) {
    console.error("Erro ao converter HTML para PDF:", err);
    return null;
  }
}
