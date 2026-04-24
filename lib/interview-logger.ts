/**
 * Interview Logger
 * Registra eventos, erros e performance da entrevista para debug e análise
 * Migrado de Supabase para MySQL
 */

import { criarLog } from "./queries/interview-logs";

export type LogSeveridade = "debug" | "info" | "warning" | "error" | "critical";

export interface LogEntrada {
  sessao_id: string;
  tipo: string; // "pergunta_enviada", "resposta_recebida", "analise_gerada", "erro", etc
  severity: LogSeveridade;
  mensagem: string;
  dados_extras?: Record<string, any>;
  timestamp: string;
  duracao_ms?: number; // para operações que levam tempo
}

class InterviewLogger {
  private sessaoId: string;
  private modelo: string = "gpt-4o-mini-mini";
  private versao: string = "1.0";
  private buffer: LogEntrada[] = [];
  private bufferSize = 10; // auto-flush quando atingir limite

  constructor(sessaoId: string) {
    this.sessaoId = sessaoId;
  }

  /**
   * Registrar log de pergunta enviada
   */
  perguntaEnviada(perguntaId: number, texto: string): void {
    this.adicionarLog({
      tipo: "pergunta_enviada",
      severity: "info",
      mensagem: `Pergunta #${perguntaId} enviada`,
      dados_extras: {
        pergunta_id: perguntaId,
        tamanho_caracteres: texto.length,
      },
    });
  }

  /**
   * Registrar log de resposta recebida
   */
  respostaRecebida(
    perguntaId: number,
    resposta: string,
    duracao: number,
  ): void {
    this.adicionarLog({
      tipo: "resposta_recebida",
      severity: "info",
      mensagem: `Resposta recebida para pergunta #${perguntaId}`,
      duracao_ms: duracao,
      dados_extras: {
        pergunta_id: perguntaId,
        tamanho_resposta: resposta.length,
        tamanho_palavras: resposta.split(/\s+/).length,
      },
    });
  }

  /**
   * Registrar log de chamada a IA
   */
  chamaIAConcluida(
    modelo: string,
    tokensUsados: number,
    duracao: number,
    sucesso: boolean,
  ): void {
    this.adicionarLog({
      tipo: "ia_chamada",
      severity: sucesso ? "info" : "warning",
      mensagem: `Chamada IA (${modelo}) ${sucesso ? "bem-sucedida" : "falhou"}`,
      duracao_ms: duracao,
      dados_extras: {
        modelo,
        tokens_usados: tokensUsados,
        sucesso,
      },
    });
  }

  /**
   * Registrar log de análise gerada
   */
  analiseGerada(
    scoreGeral: number,
    recomendacao: string,
    duracao: number,
  ): void {
    this.adicionarLog({
      tipo: "analise_gerada",
      severity: "info",
      mensagem: "Análise completada com sucesso",
      duracao_ms: duracao,
      dados_extras: {
        score_geral: scoreGeral,
        recomendacao,
      },
    });
  }

  /**
   * Registrar log de erro
   */
  erro(
    tipo: string,
    mensagem: string,
    erro: Error | string,
    critico: boolean = false,
  ): void {
    this.adicionarLog({
      tipo: `erro_${tipo}`,
      severity: critico ? "critical" : "error",
      mensagem,
      dados_extras: {
        stack: erro instanceof Error ? erro.stack : String(erro),
        tipo_erro: erro instanceof Error ? erro.constructor.name : typeof erro,
      },
    });
  }

  /**
   * Registrar persistência de resposta
   */
  respostaPersistida(
    perguntaId: number,
    estadoAnterior: string,
    estadoNovo: string,
  ): void {
    this.adicionarLog({
      tipo: "resposta_persistida",
      severity: "info",
      mensagem: `Resposta #${perguntaId} persistida`,
      dados_extras: {
        pergunta_id: perguntaId,
        estado_anterior: estadoAnterior,
        estado_novo: estadoNovo,
      },
    });
  }

  /**
   * Registrar decisão do algoritmo
   */
  decisaoTomada(
    perguntaId: number,
    acao: string,
    score: number,
    motivo: string,
  ): void {
    this.adicionarLog({
      tipo: "decisao",
      severity: "debug",
      mensagem: `Decisão para pergunta #${perguntaId}: ${acao}`,
      dados_extras: {
        pergunta_id: perguntaId,
        acao,
        score,
        motivo,
      },
    });
  }

  /**
   * Registrar warning/alerta
   */
  alerta(tipo: string, mensagem: string, dados?: Record<string, any>): void {
    this.adicionarLog({
      tipo: `alerta_${tipo}`,
      severity: "warning",
      mensagem,
      dados_extras: dados,
    });
  }

  /**
   * Adicionar log ao buffer e fazer flush se necessário
   */
  private adicionarLog(log: Omit<LogEntrada, "sessao_id" | "timestamp">): void {
    const entrada: LogEntrada = {
      sessao_id: this.sessaoId,
      timestamp: new Date().toISOString(),
      ...log,
    };

    this.buffer.push(entrada);

    // Auto-flush
    if (this.buffer.length >= this.bufferSize) {
      this.flush().catch((err) =>
        console.error("Erro ao fazer flush de logs:", err),
      );
    }
  }

  /**
   * Guardar logs na BD
   */
  async flush(): Promise<boolean> {
    if (this.buffer.length === 0) {
      return true;
    }

    try {
      const logsParaGuardar = this.buffer.splice(0, this.buffer.length);
      const { criarLog } = await import("./queries/interview-logs");

      // Guardar cada log via query function
      for (const log of logsParaGuardar) {
        await criarLog(
          log.tipo,
          log.severity,
          log.mensagem,
          log.sessao_id,
          log.dados_extras,
          log.duracao_ms,
        );
      }

      return true;
    } catch (err) {
      console.warn("Erro ao fazer flush de logs:", err);
      // Não lançar erro - logging não deve parar a entrevista
      return false;
    }
  }

  /**
   * Forçar flush final quando entrevista termina
   */
  async finalizarEntrevista(duracao_total: number): Promise<void> {
    this.adicionarLog({
      tipo: "entrevista_concluida",
      severity: "info",
      mensagem: "Entrevista concluída com sucesso",
      duracao_ms: duracao_total,
      dados_extras: {
        total_logs: this.buffer.length,
        modelo_ia: this.modelo,
        versao: this.versao,
      },
    });

    await this.flush();
  }

  /**
   * Obter resumo dos logs (para dashboard)
   */
  async obterResumo(): Promise<{
    total_logs: number;
    errors: number;
    warnings: number;
    tempo_total_ia: number;
  } | null> {
    try {
      // Retornar resumo baseado no buffer (não há logs salvos ainda)
      const errors = this.buffer.filter((l) => l.severity === "error").length;
      const warnings = this.buffer.filter(
        (l) => l.severity === "warning",
      ).length;
      const tempo_total_ia = this.buffer.reduce(
        (acc, l) => acc + (l.duracao_ms || 0),
        0,
      );

      return {
        total_logs: this.buffer.length,
        errors,
        warnings,
        tempo_total_ia,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Factory para criar logger
 */
export function criarInterviewLogger(sessaoId: string): InterviewLogger {
  return new InterviewLogger(sessaoId);
}

/**
 * Tipo para exportar
 */
export type { InterviewLogger };
