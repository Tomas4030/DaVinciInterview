/**
 * Lógica de Decisão para Entrevista
 *
 * Decide inteligentemente se a IA deve:
 * - Insistir na mesma pergunta com um follow-up
 * - Avançar para a próxima pergunta
 * - Terminar a entrevista
 *
 * Baseado em: tamanho, profundidade, qualidade e número de iterações
 */

export interface DecisionMetrics {
  tamanhoResposta: number; // número de palavras
  temExemplos: boolean;
  temJustificacao: boolean;
  temDetalhes: boolean;
  iteracaoAtual: number; // quantas vezes ja tentamos esta pergunta
  temConhecimentoTecnico?: boolean;
  qualidadeGeral: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente";
}

export interface DecisionResult {
  deveContinuarComFollowUp: boolean;
  pontuacao: number; // 0-100
  motivo: string;
  confianca: number; // 0-100
}

const TAMANHO_MINIMO = 20; // mínimo de palavras para resposta aceitável
const TAMANHO_IDEAL = 50; // resposta com este número de palavras é considerada boa
const TAMANHO_MAXIMO_ITERACOES = 4; // máximo de follow-ups antes de forçar avanço

/**
 * Analisar métrica de tamanho da resposta
 */
function analisarTamanho(tamanho: number): number {
  if (tamanho < TAMANHO_MINIMO) return 2; // muito curta
  if (tamanho < 30) return 4; // curta
  if (tamanho < TAMANHO_IDEAL) return 7; // um pouco curta
  if (tamanho < 100) return 8; // boa
  return 10; // excelente
}

/**
 * Analisar qualidade semântica da resposta
 */
function analisarQualidadeSemantica(
  qualidade: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente",
): number {
  switch (qualidade) {
    case "rejeitar":
      return 1; // não responde à pergunta
    case "minima":
      return 3; // responde mas muito vago
    case "aceitavel":
      return 6; // responde com o necessário
    case "boa":
      return 8; // boa resposta com detalhe
    case "excelente":
      return 10; // resposta completa e profunda
  }
}

/**
 * Calcular pontuação de profundidade da resposta
 */
function calcularProfundidade(metrics: DecisionMetrics): number {
  let pontos = 0;

  // Exemplos adicionam muito valor
  if (metrics.temExemplos) pontos += 25;

  // Justificação
  if (metrics.temJustificacao) pontos += 15;

  // Detalhes
  if (metrics.temDetalhes) pontos += 15;

  // Conhecimento técnico (se aplicável)
  if (metrics.temConhecimentoTecnico) pontos += 20;

  return Math.min(pontos, 100);
}

/**
 * Função principal: decidir se deve continuar ou avançar
 */
export function decidirContinuidade(metrics: DecisionMetrics): DecisionResult {
  // Penalidade por muito tempo na mesma pergunta
  if (metrics.iteracaoAtual >= TAMANHO_MAXIMO_ITERACOES) {
    return {
      deveContinuarComFollowUp: false,
      pontuacao: 0,
      motivo: `Máximo de ${TAMANHO_MAXIMO_ITERACOES} iterações atingido, avançar para próxima`,
      confianca: 100,
    };
  }

  // Análises parciais
  const pontuacaoTamanho = analisarTamanho(metrics.tamanhoResposta);
  const pontuacaoQualidade = analisarQualidadeSemantica(metrics.qualidadeGeral);
  const pontuacaoProfundidade = calcularProfundidade(metrics);

  // Cálculo ponderado (tamanho 30%, qualidade 40%, profundidade 30%)
  const pontuacaoFinal =
    pontuacaoTamanho * 0.3 +
    pontuacaoQualidade * 0.4 +
    pontuacaoProfundidade * 0.3;

  // Decisão baseada em limiar de qualidade
  let deveContinuarComFollowUp = false;
  let motivo = "";
  let confianca = 0;

  if (pontuacaoFinal < 3) {
    // Resposta muito fraca - insistir com follow-up
    deveContinuarComFollowUp = true;
    motivo = "Resposta muito curta ou vaga, peça exemplos ou aprofundamento";
    confianca = 95;
  } else if (pontuacaoFinal < 5.5) {
    // Resposta fraca - pode precisar de follow-up
    if (metrics.iteracaoAtual === 1) {
      // Primeira vez, tenta follow-up
      deveContinuarComFollowUp = true;
      motivo = "Resposta superficial, tente extrair mais detalhe";
      confianca = 80;
    } else {
      // Já é segunda vez, avança
      deveContinuarComFollowUp = false;
      motivo = "Resposta melhorou ligeiramente, mas avance para próxima";
      confianca = 70;
    }
  } else if (pontuacaoFinal < 7) {
    // Resposta aceitável
    if (metrics.iteracaoAtual === 1 && !metrics.temExemplos) {
      // Tenta uma última vez para extrair exemplos
      deveContinuarComFollowUp = true;
      motivo = "Resposta aceitável mas sem exemplos, tente pedir um";
      confianca = 65;
    } else {
      // Avança
      deveContinuarComFollowUp = false;
      motivo = "Resposta aceitável, avance para próxima pergunta";
      confianca = 85;
    }
  } else {
    // Resposta boa ou excelente
    deveContinuarComFollowUp = false;
    motivo = "Resposta com qualidade suficiente, avance para próxima";
    confianca = pontuacaoFinal >= 8.5 ? 100 : 85; // maior confiança para respostas excelentes
  }

  return {
    deveContinuarComFollowUp,
    pontuacao: Math.round(pontuacaoFinal * 10),
    motivo,
    confianca,
  };
}

/**
 * Detectar automaticamente métricas de uma resposta
 * Requer apenas a resposta do utilizador
 */
export function extrairMetricas(
  resposta: string,
  qualidadeEstimada: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente",
  iteracao: number,
): DecisionMetrics {
  const palavras = resposta.trim().split(/\s+/);
  const tamanho = palavras.length;
  const respostaMinuscula = resposta.toLowerCase();

  // Detectar padrões
  const temExemplos =
    /por exemplo|exemplo|como|quando|que|situação|projeto|caso/i.test(resposta);
  const temJustificacao =
    /portanto|por isso|porque|visto que|já que|dado que|uma vez que/i.test(
      resposta,
    );
  const temDetalhes = tamanho > 40 && resposta.split(".").length > 2;
  const temConhecimentoTecnico =
    /api|database|javascript|python|react|node|sql|html|css|git|docker|cloud|backend|frontend|framework|biblioteca|algoritmo|estrutura|design/i.test(
      resposta,
    );

  return {
    tamanhoResposta: tamanho,
    temExemplos,
    temJustificacao,
    temDetalhes,
    iteracaoAtual: iteracao,
    temConhecimentoTecnico,
    qualidadeGeral: qualidadeEstimada,
  };
}

/**
 * Sugerir tipo de follow-up com base nas métricas
 */
export function sugerirTipoFollowUp(
  metrics: DecisionMetrics,
): "exemplo" | "aprofundamento" | "contexto" | "detalhes" | null {
  if (!metrics.temExemplos && metrics.qualidadeGeral === "minima") {
    return "exemplo";
  }

  if (!metrics.temJustificacao && metrics.tamanhoResposta > 30) {
    return "aprofundamento";
  }

  if (
    metrics.temConhecimentoTecnico === undefined ||
    !metrics.temConhecimentoTecnico
  ) {
    return "contexto";
  }

  if (metrics.tamanhoResposta < 40) {
    return "detalhes";
  }

  return null;
}

/**
 * Gerar prompt de follow-up baseado no tipo sugerido
 */
export function gerarFollowUpPrompt(
  tipoFollowUp: "exemplo" | "aprofundamento" | "contexto" | "detalhes",
  perguntaOriginal: string,
): string {
  switch (tipoFollowUp) {
    case "exemplo":
      return `${perguntaOriginal} Pode dar um exemplo específico?`;
    case "aprofundamento":
      return `Pode aprofundar um pouco mais? Qual foi a sua abordagem?`;
    case "contexto":
      return `${perguntaOriginal} Em que contexto ocorreu isto?`;
    case "detalhes":
      return `Gostaria de ouvir mais detalhes sobre isto. Continue.`;
  }
}
