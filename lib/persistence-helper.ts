/**
 * Helper para persistência segura de respostas
 * Garante que apenas respostas finais (no estado "completed") são guardadas
 * Implementa idempotência para evitar duplicatas
 * Migrado de Supabase para MySQL
 */

import { FollowUpRecord } from "./database.types";
import { salvarRespostaV2, buscarRespostasV2 } from "./queries/analises";

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
    // Usar a query function do MySQL
    await salvarRespostaV2(
      resposta.sessao_id,
      resposta.vaga_id,
      resposta.pergunta_id,
      resposta.resposta_final,
      "aceitavel", // qualidade padrão
      {
        tamanho_resposta: resposta.resposta_final.length,
        tempo_resposta_segundos: 0, // não temos esse dado aqui
      },
    );

    return {
      sucesso: true,
      mensagem: "Resposta guardada com sucesso",
      dados: resposta,
    };
  } catch (error) {
    console.error("[guardarRespostaPersistencia]", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro desconhecido",
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
    const respostas = await buscarRespostasV2(sessaoId);
    return {
      sucesso: true,
      dados: respostas,
    };
  } catch (error) {
    console.error("[obterRespostasGuardadas]", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro desconhecido",
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
    const respostas = await buscarRespostasV2(sessaoId);
    const perguntasGuardadas = new Set(respostas.map((r) => r.pergunta_id));
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
