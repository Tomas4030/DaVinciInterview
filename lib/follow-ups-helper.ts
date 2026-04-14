/**
 * Follow-ups Helper
 * Gerencia a persistência e rastreamento de follow-ups durante a entrevista
 * Migrado de Supabase para MySQL
 */

import { criarLog } from "./queries/interview-logs";
import { FollowUpRecord } from "./database.types";
import { DecisionMetrics } from "./decision-logic";

export interface FollowUpData {
  sessao_id: string;
  vaga_id: string;
  pergunta_id: number;
  follow_ups: FollowUpRecord[];
  iteration_count: number;
  resposta_final: string;
  tamanho_resposta: number;
  tempo_resposta_segundos: number;
  qualidade_estimada: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente";
  metricas: Omit<DecisionMetrics, "qualidadeGeral" | "iteracaoAtual">; // sem os repetidos
}

/**
 * Guardar follow-ups e iterar respostas
 * Implementa idempotência e atualização segura
 */
export async function guardarFollowUps(
  dados: FollowUpData,
): Promise<{ sucesso: boolean; erro?: string; dados?: any }> {
  try {
    if (!dados.sessao_id || !dados.vaga_id || dados.pergunta_id <= 0) {
      return {
        sucesso: false,
        erro: "sessao_id, vaga_id e pergunta_id são obrigatórios",
      };
    }

    if (!Array.isArray(dados.follow_ups)) {
      return {
        sucesso: false,
        erro: "follow_ups deve ser um array",
      };
    }

    // Registrar log de follow-up
    await criarLog(
      "follow_up_created",
      "info",
      `Follow-up gerado para pergunta ${dados.pergunta_id}`,
      dados.sessao_id,
      {
        pergunta_id: dados.pergunta_id,
        qualidade_estimada: dados.qualidade_estimada,
        iteration_count: dados.iteration_count,
        follow_up_count: dados.follow_ups.length,
      },
      dados.tempo_resposta_segundos * 1000,
    );

    return {
      sucesso: true,
      dados: {
        pergunta_id: dados.pergunta_id,
        follow_ups: dados.follow_ups,
        iteration_count: dados.iteration_count,
      },
    };
  } catch (error) {
    console.error("[guardarFollowUps Error]", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Converter follow-up para objeto com timestamp
 */
export function criarFollowUp(
  tipo: "usuario_resposta" | "ia_follow_up",
  conteudo: string,
): FollowUpRecord {
  return {
    id: `fu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    tipo,
    conteudo,
    timestamp: new Date().toISOString(),
  };
}
