/**
 * Follow-ups Helper
 * Gerencia a persistência e rastreamento de follow-ups durante a entrevista
 */

import { createClient } from "@supabase/supabase-js";
import { FollowUpRecord } from "./database.types";
import { DecisionMetrics } from "./decision-logic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

    // Verificar se já existe essa resposta
    const { data: existente, error: fetchError } = await supabase
      .from("candidato_respostas_v2")
      .select("id, follow_ups, iteration_count")
      .eq("sessao_id", dados.sessao_id)
      .eq("pergunta_id", dados.pergunta_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = não encontrado (é normal)
      return {
        sucesso: false,
        erro: `Erro ao verificar resposta existente: ${fetchError.message}`,
      };
    }

    const agora = new Date().toISOString();

    if (existente) {
      // Atualizar (merge de follow-ups)
      const followUpsExistentes = existente.follow_ups || [];
      const followUpsMerge = [...followUpsExistentes, ...dados.follow_ups];

      const { data, error } = await supabase
        .from("candidato_respostas_v2")
        .update({
          resposta_final: dados.resposta_final,
          follow_ups: followUpsMerge,
          iteration_count: dados.iteration_count,
          tamanho_resposta: dados.tamanho_resposta,
          tempo_resposta_segundos: dados.tempo_resposta_segundos,
          qualidade_estimada: dados.qualidade_estimada,
          tem_exemplos: dados.metricas.temExemplos,
          tem_justificacao: dados.metricas.temJustificacao,
          tem_detalhes: dados.metricas.temDetalhes,
          tem_conhecimento_tecnico: dados.metricas.temConhecimentoTecnico,
          atualizada_em: agora,
        })
        .eq("sessao_id", dados.sessao_id)
        .eq("pergunta_id", dados.pergunta_id)
        .select()
        .single();

      if (error) {
        return {
          sucesso: false,
          erro: `Erro ao atualizar follow-ups: ${error.message}`,
        };
      }

      return {
        sucesso: true,
        dados: data,
      };
    } else {
      // Inserir novo
      const { data, error } = await supabase
        .from("candidato_respostas_v2")
        .insert({
          sessao_id: dados.sessao_id,
          vaga_id: dados.vaga_id,
          pergunta_id: dados.pergunta_id,
          resposta_final: dados.resposta_final,
          iteration_count: dados.iteration_count,
          follow_ups: dados.follow_ups,
          estado: "in_progress",
          tamanho_resposta: dados.tamanho_resposta,
          tempo_resposta_segundos: dados.tempo_resposta_segundos,
          qualidade_estimada: dados.qualidade_estimada,
          tem_exemplos: dados.metricas.temExemplos,
          tem_justificacao: dados.metricas.temJustificacao,
          tem_detalhes: dados.metricas.temDetalhes,
          tem_conhecimento_tecnico: dados.metricas.temConhecimentoTecnico,
          criada_em: agora,
          atualizada_em: agora,
        })
        .select()
        .single();

      if (error) {
        return {
          sucesso: false,
          erro: `Erro ao criar resposta: ${error.message}`,
        };
      }

      return {
        sucesso: true,
        dados: data,
      };
    }
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      sucesso: false,
      erro: mensagem,
    };
  }
}

/**
 * Obter histórico completo de uma pergunta (incluindo todos os follow-ups)
 */
export async function obterHistoriaoPergunta(
  sessaoId: string,
  perguntaId: number,
): Promise<{
  sucesso: boolean;
  dados?: any;
  erro?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("candidato_respostas_v2")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("pergunta_id", perguntaId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          sucesso: true,
          dados: null,
        };
      }
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    return {
      sucesso: true,
      dados: data,
    };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      sucesso: false,
      erro: mensagem,
    };
  }
}

/**
 * Obter estatísticas de uma sessão
 */
export async function obterEstatisticasSessao(sessaoId: string): Promise<{
  sucesso: boolean;
  dados?: {
    totalPerguntas: number;
    totalFollowUps: number;
    mediaIteracoes: number;
    perguntasComExemplos: number;
    mediaQualidade: string;
    tempoMedioResposta: number;
  };
  erro?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("candidato_respostas_v2")
      .select(
        "pergunta_id, iteration_count, follow_ups, tem_exemplos, qualidade_estimada, tempo_resposta_segundos",
      )
      .eq("sessao_id", sessaoId);

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        sucesso: true,
        dados: {
          totalPerguntas: 0,
          totalFollowUps: 0,
          mediaIteracoes: 0,
          perguntasComExemplos: 0,
          mediaQualidade: "N/A",
          tempoMedioResposta: 0,
        },
      };
    }

    const totalFollowUps = data.reduce(
      (acc, r) => acc + (Array.isArray(r.follow_ups) ? r.follow_ups.length : 0),
      0,
    );
    const mediaIteracoes =
      data.reduce((acc, r) => acc + (r.iteration_count || 1), 0) / data.length;
    const perguntasComExemplos = data.filter((r) => r.tem_exemplos).length;
    const tempoMedioResposta =
      data.reduce((acc, r) => acc + (r.tempo_resposta_segundos || 0), 0) /
      data.length;

    // Média de qualidade (simplista: contar pontos)
    const pontuacoes = data.map((r) => {
      switch (r.qualidade_estimada) {
        case "rejeitar":
          return 1;
        case "minima":
          return 2;
        case "aceitavel":
          return 3;
        case "boa":
          return 4;
        case "excelente":
          return 5;
        default:
          return 3;
      }
    });
    const mediaPontos =
      pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length;
    const qualidadeMedia =
      mediaPontos < 1.5
        ? "rejeitar"
        : mediaPontos < 2.5
          ? "minima"
          : mediaPontos < 3.5
            ? "aceitavel"
            : mediaPontos < 4.5
              ? "boa"
              : "excelente";

    return {
      sucesso: true,
      dados: {
        totalPerguntas: data.length,
        totalFollowUps,
        mediaIteracoes: Math.round(mediaIteracoes * 10) / 10,
        perguntasComExemplos,
        mediaQualidade: qualidadeMedia,
        tempoMedioResposta: Math.round(tempoMedioResposta),
      },
    };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      sucesso: false,
      erro: mensagem,
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
