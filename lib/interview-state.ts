/**
 * Interview State Machine
 *
 * Gerencia o estado de cada pergunta durante uma entrevista.
 * Estados: pending → in_progress → completed → saved
 *
 * - pending: Pergunta ainda não respondida pelo utilizador
 * - in_progress: Utilizador respondeu, mas podem existir follow-ups em curso
 * - completed: IA considera que tem resposta suficiente, pronta para guardar
 * - saved: Resposta foi persistida na BD
 */

export type QuestionState = "pending" | "in_progress" | "completed" | "saved";

export interface QuestionStatus {
  pergunta_id: number;
  state: QuestionState;
  resposta_texto: string;
  follow_ups: FollowUp[];
  iteration_count: number;
  timestamp_inicio: string;
  timestamp_ultima_atualizacao: string;
}

export interface FollowUp {
  id: string;
  tipo: "usuario_resposta" | "ia_follow_up";
  conteudo: string;
  timestamp: string;
}

export class InterviewStateManager {
  private questionsState: Map<number, QuestionStatus> = new Map();
  private activePerguntaId: number | null = null;

  /**
   * Inicializar estado para um conjunto de perguntas
   */
  inicializar(perguntasIds: number[]): void {
    const agora = new Date().toISOString();

    perguntasIds.forEach((id) => {
      this.questionsState.set(id, {
        pergunta_id: id,
        state: "pending",
        resposta_texto: "",
        follow_ups: [],
        iteration_count: 0,
        timestamp_inicio: agora,
        timestamp_ultima_atualizacao: agora,
      });
    });
  }

  /**
   * Marcar pergunta como iniciada (primeira resposta do utilizador)
   */
  iniciarPergunta(perguntaId: number, respostaTeхto: string): void {
    const status = this.questionsState.get(perguntaId);
    if (!status) {
      throw new Error(`Pergunta ${perguntaId} não foi inicializada`);
    }

    status.state = "in_progress";
    status.resposta_texto = respostaTeхto;
    status.iteration_count = 1;
    status.timestamp_ultima_atualizacao = new Date().toISOString();
    status.follow_ups.push({
      id: this.gerarIdFollowUp(),
      tipo: "usuario_resposta",
      conteudo: respostaTeхto,
      timestamp: new Date().toISOString(),
    });

    this.activePerguntaId = perguntaId;
  }

  /**
   * Adicionar follow-up (comentário de IA ou pergunta complementar)
   */
  adicionarFollowUp(
    perguntaId: number,
    tipo: "usuario_resposta" | "ia_follow_up",
    conteudo: string,
  ): void {
    const status = this.questionsState.get(perguntaId);
    if (!status) {
      throw new Error(`Pergunta ${perguntaId} não foi inicializada`);
    }

    if (status.state !== "in_progress") {
      throw new Error(
        `Não é possível adicionar follow-up em pergunta no estado ${status.state}`,
      );
    }

    if (tipo === "usuario_resposta") {
      status.resposta_texto = conteudo; // Atualiza com resposta mais recente
      status.iteration_count += 1;
    }

    status.follow_ups.push({
      id: this.gerarIdFollowUp(),
      tipo,
      conteudo,
      timestamp: new Date().toISOString(),
    });

    status.timestamp_ultima_atualizacao = new Date().toISOString();
  }

  /**
   * Marcar pergunta como completada (IA decidiu avançar)
   * Isto significa que a resposta final está pronta para ser guardada
   */
  completarPergunta(
    perguntaId: number,
    respostaFinal?: string,
  ): QuestionStatus {
    const status = this.questionsState.get(perguntaId);
    if (!status) {
      throw new Error(`Pergunta ${perguntaId} não foi inicializada`);
    }

    if (status.state !== "in_progress") {
      throw new Error(
        `Apenas perguntas em "in_progress" podem ser completadas`,
      );
    }

    if (respostaFinal) {
      status.resposta_texto = respostaFinal;
    }

    status.state = "completed";
    status.timestamp_ultima_atualizacao = new Date().toISOString();

    return { ...status };
  }

  /**
   * Marcar pergunta como guardada na BD
   */
  marcarComoGuardada(perguntaId: number): void {
    const status = this.questionsState.get(perguntaId);
    if (!status) {
      throw new Error(`Pergunta ${perguntaId} não foi inicializada`);
    }

    status.state = "saved";
    status.timestamp_ultima_atualizacao = new Date().toISOString();
  }

  /**
   * Obter estado de uma pergunta específica
   */
  obterStatus(perguntaId: number): QuestionStatus | null {
    return this.questionsState.get(perguntaId) || null;
  }

  /**
   * Obter pergunta ativa (em progresso)
   */
  obterPerguntaAtiva(): number | null {
    return this.activePerguntaId;
  }

  /**
   * Definir pergunta ativa
   */
  definirPerguntaAtiva(perguntaId: number): void {
    this.activePerguntaId = perguntaId;
  }

  /**
   * Obter todas as respostas finais gravadas
   * Apenas retorna perguntas no estado "saved"
   */
  obterRespostas(): Array<{
    pergunta_id: number;
    resposta_texto: string;
    iteration_count: number;
    follow_ups_count: number;
    timestamp: string;
  }> {
    const respostas = [];

    for (const [, status] of this.questionsState) {
      if (status.state === "saved") {
        respostas.push({
          pergunta_id: status.pergunta_id,
          resposta_texto: status.resposta_texto,
          iteration_count: status.iteration_count,
          follow_ups_count: status.follow_ups.length,
          timestamp: status.timestamp_ultima_atualizacao,
        });
      }
    }

    return respostas;
  }

  /**
   * Obter histórico completo (inclusive follow-ups) de uma pergunta
   * Útil para análise e debug
   */
  obterHistorial(perguntaId: number): QuestionStatus | null {
    return this.questionsState.get(perguntaId) || null;
  }

  /**
   * Obter estado geral da entrevista
   */
  obterEstadoGeral(): {
    totalPerguntas: number;
    pendentes: number;
    emProgresso: number;
    completadas: number;
    guardadas: number;
  } {
    let pendentes = 0;
    let emProgresso = 0;
    let completadas = 0;
    let guardadas = 0;

    for (const [, status] of this.questionsState) {
      switch (status.state) {
        case "pending":
          pendentes++;
          break;
        case "in_progress":
          emProgresso++;
          break;
        case "completed":
          completadas++;
          break;
        case "saved":
          guardadas++;
          break;
      }
    }

    return {
      totalPerguntas: this.questionsState.size,
      pendentes,
      emProgresso,
      completadas,
      guardadas,
    };
  }

  /**
   * Resetar estado completo
   */
  resetar(): void {
    this.questionsState.clear();
    this.activePerguntaId = null;
  }

  /**
   * Exportar estado completo (para debug ou persistência)
   */
  exportar(): {
    questionsState: Map<number, QuestionStatus>;
    activePerguntaId: number | null;
  } {
    return {
      questionsState: new Map(this.questionsState),
      activePerguntaId: this.activePerguntaId,
    };
  }

  /**
   * Importar estado (para recuperar de persistência)
   */
  importar(dados: {
    questionsState: Map<number, QuestionStatus>;
    activePerguntaId: number | null;
  }): void {
    this.questionsState = new Map(dados.questionsState);
    this.activePerguntaId = dados.activePerguntaId;
  }

  private gerarIdFollowUp(): string {
    return `fu_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Criar instância global para uma sessão de entrevista
 * Pode ser usada através de contexto React ou importação direta
 */
export function criarInterviewStateManager(): InterviewStateManager {
  return new InterviewStateManager();
}
