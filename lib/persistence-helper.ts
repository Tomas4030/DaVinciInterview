/**
 * Helper para persistência segura de respostas
 * Garante que apenas respostas finais (no estado "completed") são guardadas
 * Implementa idempotência para evitar duplicatas
 */

import { createClient } from "@supabase/supabase-js";
import { FollowUpRecord } from "./database.types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface RespostaPersistencia {
  sessao_id: string;
  vaga_id: string;
  pergunta_id: number;
  resposta_final: string;
  iteration_count: number;
  follow_ups: FollowUpRecord[];
  estado: "in_progress" | "completed" | "saved";
}

export interface ResultadoPersistencia {
  sucesso: boolean;
  mensagem: string;
  dados?: any;
  erro?: string;
}

/**
 * Validar se uma resposta pode ser persistida
 * Apenas respostas no estado "completed" devem ser persistidas
 */
export function validarRespostaPersistencia(resposta: RespostaPersistencia): {
  valida: boolean;
  erro?: string;
} {
  if (resposta.estado !== "completed") {
    return {
      valida: false,
      erro: `Resposta em estado "${resposta.estado}" não pode ser persistida. Apenas "completed" é válido.`,
    };
  }

  if (!resposta.resposta_final || resposta.resposta_final.trim() === "") {
    return {
      valida: false,
      erro: "Resposta final não pode estar vazia",
    };
  }

  if (resposta.pergunta_id <= 0) {
    return {
      valida: false,
      erro: "pergunta_id inválido",
    };
  }

  if (!resposta.sessao_id) {
    return {
      valida: false,
      erro: "sessao_id é obrigatório",
    };
  }

  return { valida: true };
}

/**
 * Guardar uma resposta na BD de forma segura
 * Implementa idempotência: se já existe resposta para essa pergunta, atualiza
 */
export async function guardarRespostaPersistencia(
  resposta: RespostaPersistencia,
): Promise<ResultadoPersistencia> {
  // Validar
  const validacao = validarRespostaPersistencia(resposta);
  if (!validacao.valida) {
    return {
      sucesso: false,
      erro: validacao.erro,
      mensagem: "Validação falhou",
    };
  }

  try {
    // Verificar se já existe resposta para essa pergunta nesta sessão
    const { data: existente } = await supabase
      .from("candidato_respostas_v2")
      .select("id")
      .eq("sessao_id", resposta.sessao_id)
      .eq("pergunta_id", resposta.pergunta_id)
      .single();

    if (existente) {
      // Atualizar resposta existente (idempotência)
      const { data, error } = await supabase
        .from("candidato_respostas_v2")
        .update({
          resposta_final: resposta.resposta_final,
          iteration_count: resposta.iteration_count,
          follow_ups: resposta.follow_ups,
          estado: "saved",
          atualizada_em: new Date().toISOString(),
          guardada_em: new Date().toISOString(),
        })
        .eq("sessao_id", resposta.sessao_id)
        .eq("pergunta_id", resposta.pergunta_id)
        .select()
        .single();

      if (error) {
        return {
          sucesso: false,
          erro: error.message,
          mensagem: "Erro ao atualizar resposta",
        };
      }

      return {
        sucesso: true,
        mensagem: "Resposta atualizada com sucesso",
        dados: data,
      };
    } else {
      // Inserir nova resposta
      const { data, error } = await supabase
        .from("candidato_respostas_v2")
        .insert({
          sessao_id: resposta.sessao_id,
          vaga_id: resposta.vaga_id,
          pergunta_id: resposta.pergunta_id,
          resposta_final: resposta.resposta_final,
          iteration_count: resposta.iteration_count,
          follow_ups: resposta.follow_ups,
          estado: "saved",
          criada_em: new Date().toISOString(),
          atualizada_em: new Date().toISOString(),
          guardada_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          sucesso: false,
          erro: error.message,
          mensagem: "Erro ao criar resposta",
        };
      }

      return {
        sucesso: true,
        mensagem: "Resposta criada com sucesso",
        dados: data,
      };
    }
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      sucesso: false,
      erro: mensagem,
      mensagem: "Erro ao guardar resposta",
    };
  }
}

/**
 * Obter todas as respostas guardadas de uma sessão
 * Apenas retorna respostas no estado "saved"
 */
export async function obterRespostasGuardadas(sessaoId: string): Promise<{
  sucesso: boolean;
  dados?: any[];
  erro?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("candidato_respostas_v2")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("estado", "saved")
      .order("pergunta_id", { ascending: true });

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    return {
      sucesso: true,
      dados: data || [],
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
 * Verificar se uma sessão tem todas as respostas guardadas
 */
export async function verificarSessaoCompleta(
  sessaoId: string,
  totalPerguntas: number,
): Promise<{
  completa: boolean;
  respostasGuardadas: number;
  perguntasFaltantes: number[];
}> {
  try {
    const { data } = await supabase
      .from("candidato_respostas_v2")
      .select("pergunta_id")
      .eq("sessao_id", sessaoId)
      .eq("estado", "saved");

    const perguntasGuardadas = new Set(data?.map((r) => r.pergunta_id) || []);
    const perguntasFaltantes = [];

    for (let i = 1; i <= totalPerguntas; i++) {
      if (!perguntasGuardadas.has(i)) {
        perguntasFaltantes.push(i);
      }
    }

    return {
      completa: perguntasFaltantes.length === 0,
      respostasGuardadas: perguntasGuardadas.size,
      perguntasFaltantes,
    };
  } catch {
    return {
      completa: false,
      respostasGuardadas: 0,
      perguntasFaltantes: Array.from(
        { length: totalPerguntas },
        (_, i) => i + 1,
      ),
    };
  }
}
