/**
 * Response Validator
 * Valida a qualidade e contextualidade das respostas durante a entrevista
 * Impede avanço com respostas incompreensíveis, fora de contexto ou inúteis
 */

export type ValidationStatus =
  | "válida_suficiente"
  | "válida_curta"
  | "fora_contexto"
  | "incompreensível";

export interface ValidationResult {
  status: ValidationStatus;
  valid: boolean; // true se pode avançar, false se precisa retry
  feedback?: string; // mensagem para o utilizador (apenas se inválido)
}

/**
 * Palavras/padrões que indicam falta de resposta útil
 */
const NOISE_PATTERNS = [
  /^(ahhh|ugh|hmm|bla|blá|meh|vhy|lol|xd|kkkk|hahaha|n sei|anda|sei lá)$/i,
  /^[a-z]{1,3}$/i, // Respostas muito curtas (1-3 letras)
  /^(eletrodomésticos|pizza|céu|comida|filme|série|jogo|música|carro|casa|gato|cão|árvore|flor).*$/i, // Tópicos aleatórios conhecidos
  /\b(pizza com ananás|o céu está azul|meu cão|meu gato|filme bom|série|jogo)\b/i, // Exemplos específicos de "lixo"
];

const REJECTION_PATTERNS = [
  /^(n|não|nao|nada|nunca|never|fuck|shit|crl|pls|wtf)\.?$/i,
  /^(google it|ask chatgpt|idk|afk|brb)$/i,
  /^(sou robot|sou ai|sou bot|sou gpt)$/i,
];

const MINIMAL_LENGTH = 3; // Mínimo de caracteres para ser considerada resposta

/**
 * Detecta se resposta é puro ruído/incompreensível
 */
function isPureNoise(resposta: string): boolean {
  const normalized = resposta.toLowerCase().trim();

  if (normalized.length < MINIMAL_LENGTH) return true;

  return NOISE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Detecta se resposta é claramente uma rejeição/recusa
 */
function isRejection(resposta: string): boolean {
  const normalized = resposta.toLowerCase().trim();
  return REJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Detecta se resposta é uma pergunta de clarificação ou aviso de UX
 * (ex: "quais linguagens?", "não vejo nada", "o que?")
 */
function isClarificationOrUXIssue(resposta: string): boolean {
  const normalized = resposta.toLowerCase().trim();

  // Padrões de pergunta/clarificação
  const clarificationPatterns =
    /qual|que|o?quê|onde|como|por que|porquê|quais|o?quê/i;

  // Padrões de aviso de UX (não se vê conteúdo)
  const uxWarningPatterns =
    /não|nao|vejo|ver|aparece|aparecer|mostra|mostrar|nada|n vejo|invisible|hidden/i;

  // Se é uma pergunta sobre clarificação → considerar como legítima tentativa de resposta
  if (clarificationPatterns.test(normalized)) {
    // Mas apenas se também menciona algo relacionado ao tópico
    if (/linguag|tecnolog|nível|skill|competência/i.test(normalized)) {
      return true; // É uma clarificação legítima
    }
  }

  // Se é um aviso de UX → também considerar legítimo
  if (uxWarningPatterns.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Detecta se resposta é válida mas muito curta
 *
 * IMPORTANTE: Respostas numéricas (nota, idade, telefone) são válidas mesmo curtas
 */
function isShortValid(resposta: string): boolean {
  const palavras = resposta.trim().split(/\s+/).length;
  const hasQuotes = /["']/.test(resposta);
  const hasEmail = /@/.test(resposta);
  const hasPhone = /\d{3,}/.test(resposta);
  const hasNumber = /\d+/.test(resposta);
  const hasNivel =
    /básico|médio|bom|avançado|elevado|low|medium|high|beginner/i.test(
      resposta,
    );

  // Respostas curtas podem ser válidas se:
  // - Têm 2+ palavras (resposta conversacional curta)
  // - Têm número (age, score, phone → resposta legítima curta)
  // - Têm email
  // - Têm nivel qualitativo sem mais detalhes (valid short)
  // - Têm aspas (citação)
  return (
    palavras >= 2 ||
    (hasNumber && resposta.length >= 2) || // "18", "20", "5.5"
    hasEmail ||
    hasPhone ||
    hasNivel ||
    (hasQuotes && resposta.length > 5)
  );
}

/**
 * Detecta se resposta tem detalhe/contexto suficiente
 */
function hasEnoughDetail(resposta: string): boolean {
  const palavras = resposta.trim().split(/\s+/).length;
  const temExemplos =
    /exemplo|projeto|como|quando|porque|porque|porquê|qual|quais/i.test(
      resposta,
    );
  const temListagem = /,|;|\||-/.test(resposta);
  const temPontuacao = /\.|!|\?/.test(resposta);

  return (
    (palavras >= 10 && temPontuacao) ||
    (temExemplos && palavras >= 8) ||
    (temListagem && palavras >= 5)
  );
}

/**
 * Analisa se resposta está claramente fora de contexto
 * Verificando se tópico da resposta é completamente não-relacionado
 * com a pergunta
 *
 * IMPORTANTE: Menos rigorosso com listas de tecnologias
 * O utilizador não precisa responder sobre TODAS, apenas sobre as que conhece
 */
function isOutOfContext(pergunta: string, resposta: string): boolean {
  const perguntaNorm = pergunta.toLowerCase();
  const respostaNorm = resposta.toLowerCase();

  // ─────────────────────────────────────────────────────────────
  // Detecção especial para "pergunta de LOCALIDADE"
  // Se pergunta é sobre "onde vives", aceita se tem alguma localidade válida
  // ─────────────────────────────────────────────────────────────
  const isLocationQuestion =
    /(localidade|residência|morada|onde|vive|lives)/i.test(perguntaNorm);

  if (isLocationQuestion) {
    // Se tem pelo menos 2 caracteres alfabéticos consecutivos (para cidade)
    // aceita a resposta
    const hasLocationPattern = /[a-záéíóúãõç]{2,}/i.test(respostaNorm);

    if (hasLocationPattern) {
      return false; // NOT out of context - tem localidade
    }

    return true; // Fora de contexto - sem localidade identificada
  }

  // ─────────────────────────────────────────────────────────────
  // Detecção especial para "pergunta de TECNOLOGIAS/NÍVEL"
  // É uma tech question se:
  // - Pergunta tem "nível" ou "skill" ou "competência"
  // - OU se a resposta claramente menciona tecnologias com níveis
  // ─────────────────────────────────────────────────────────────
  const temNivelNaResposta =
    /\bnível\b|básico|médio|bom|avançado|elevado|beginner|intermediate|advanced|junior|senior|expert|proficient|low|high/i.test(
      respostaNorm,
    );
  const temTecnologiaNaResposta =
    /(python|javascript|js|java|php|c#|c\+\+|ruby|go|rust|typescript|sql|html|css|react|vue|angular|express|django|fastapi|mysql|mongodb|postgres|firebase|node|spring|kotlin|swift|git)/i.test(
      respostaNorm,
    );

  // Detecta se é uma pergunta de tech baseado em palavras-chave
  const explicitTechQuestion =
    /\bnível\b|level|skill|competência|\btecnologia|\btechnology|\blinguagem|\blanguage/i.test(
      perguntaNorm,
    );

  // Se a resposta menciona tecnologias com níveis OU a pergunta é claramente sobre tech
  if (
    (temNivelNaResposta && temTecnologiaNaResposta) ||
    (explicitTechQuestion && (temNivelNaResposta || temTecnologiaNaResposta))
  ) {
    return false; // NOT out of context - é uma resposta válida sobre tech
  }

  // Se pergunta é explicitamente sobre tech mas resposta não tem techs
  if (explicitTechQuestion && !temTecnologiaNaResposta && !temNivelNaResposta) {
    return true; // Fora de contexto - pergunta sobre tech mas sem mencionar nada
  }

  // ─────────────────────────────────────────────────────────────
  // Contextos padrão (menos rigorosos)
  // ─────────────────────────────────────────────────────────────
  const contextMaps: Record<string, RegExp> = {
    // Email/Telefone
    "(email|telefone|telemóvel|celular|contacto|contact)":
      /@|[0-9]{3,}|\.pt|com/,
    // Localidade (cidade/região - single or multiple words)
    // Aceita: Albufeira, Porto, Lisboa, Cascais, Vila Real, etc.
    "(localidade|residência|morada|onde|vive|lives)":
      /\b[a-záéíóúãõç]{2,}(\s[a-záéíóúãõç]{2,})*\b|Portugal|EU/i,
    // Nota/Nível (escalar simples)
    "(nota|score|pontuação|avaliação|mark)": /[0-9]{1,3}|dez|vinte|quinze/i,
    // Experiência/Projetos
    "(projeto|experiência|trabalho|sistema|aplicação|app|desenvolveu)":
      /projeto|sistema|app|website|site|base.{0,5}dados|código|programação|fiz|criei|desenvolvi/i,
    // IA/Conceitos
    "(inteligência artificial|machine learning|IA|chat|bot)":
      /ai|machine.{0,2}learning|neural|deeplearning|modelo|algoritmo|openai|chatgpt|bot|chatbot|llm/i,
  };

  // Encontra contexto esperado da pergunta
  for (const [pattern, expectedKeywords] of Object.entries(contextMaps)) {
    if (new RegExp(pattern, "i").test(perguntaNorm)) {
      // Se pergunta é deste tipo, resposta deve conter keywords relacionadas
      if (!expectedKeywords.test(respostaNorm)) {
        return true; // Fora de contexto
      }
    }
  }

  return false;
}

/**
 * Valida se uma resposta é aceitável para continuar a entrevista
 *
 * Retorna:
 * - válida_suficiente: pode avançar diretamente
 * - válida_curta: pode fazer follow-up
 * - fora_contexto: pedir resposta correcta à pergunta atual
 * - incompreensível: pedir clarificação
 */
export function validarQualidadeResposta(
  pergunta: string,
  resposta: string,
  iteracao: number = 1,
): ValidationResult {
  const respostaTrimmed = resposta.trim();
  const perguntaNorm = pergunta.toLowerCase();

  // 1. Mínimo de caracteres (MAS números são exceção)
  const hasNumber = /\d+/.test(respostaTrimmed);
  if (respostaTrimmed.length < MINIMAL_LENGTH && !hasNumber) {
    return {
      status: "incompreensível",
      valid: false,
      feedback:
        "A tua resposta é muito curta. Consegues elaborar um pouco mais?",
    };
  }

  // 2. Puro ruído
  if (isPureNoise(respostaTrimmed)) {
    return {
      status: "incompreensível",
      valid: false,
      feedback:
        "Não consegui compreender a tua resposta. Podes tentar novamente?",
    };
  }

  // 3. Claramente rejeição/recusa estranha
  if (isRejection(respostaTrimmed)) {
    return {
      status: "incompreensível",
      valid: false,
      feedback:
        "Parece que não queres responder. Podes tentar responder à pergunta?",
    };
  }

  // 4. Clarificação ou aviso de UX legítimo
  // Se o utilizador está a pedir clarificação ou reportar um problema
  // considerar como resposta válida (ele está a tentar engajar)
  if (
    isClarificationOrUXIssue(respostaTrimmed) &&
    /linguag|tecnolog|nível|skill/i.test(perguntaNorm)
  ) {
    return {
      status: "válida_suficiente",
      valid: true,
    };
  }

  // ────────────────────────────────────────────────────────────
  // PRÉ-VALIDAÇÃO: Se resposta é claramente sobre tech skills
  // Aceitar imediatamente mesmo que não siga padrão exato
  // ────────────────────────────────────────────────────────────
  const temTechSkillsPattern =
    /\b(tenho|tem|nivel|nível|basico|básico|medio|médio|bom|avançado)/i.test(
      respostaTrimmed,
    );
  const temTechs =
    /(php|mysql|javascript|js|python|css|bootstrap|java|react|angular)/i.test(
      respostaTrimmed,
    );

  if (temTechSkillsPattern && temTechs && respostaTrimmed.length > 10) {
    // É claramente uma resposta sobre tech skills → válida
    return {
      status: "válida_suficiente",
      valid: true,
    };
  }

  // ────────────────────────────────────────────────────────────
  // CONTEXTO ESPECÍFICO: Pergunta de NOTA/PONTUAÇÃO
  // "qual a tua nota" → resposta numérica é suficiente
  // ────────────────────────────────────────────────────────────
  if (/(nota|pontuação|score|mark|classificação)/.test(perguntaNorm)) {
    if (hasNumber) {
      return {
        status: "válida_suficiente",
        valid: true,
      };
    }
  }

  // 4. Fora de contexto (APÓS validações específicas)
  if (isOutOfContext(pergunta, respostaTrimmed)) {
    return {
      status: "fora_contexto",
      valid: false,
      feedback:
        "A tua resposta não corresponde à pergunta. Consegues responder correctamente?",
    };
  }

  // 5. Se já tem detalhe suficiente → válida e suficiente
  if (hasEnoughDetail(respostaTrimmed)) {
    return {
      status: "válida_suficiente",
      valid: true,
    };
  }

  // 6. Se é curta mas válida → válida mas curta
  if (isShortValid(respostaTrimmed)) {
    return {
      status: "válida_curta",
      valid: true,
    };
  }

  // 7. Se passou todas validações mas é vaga → válida mas curta
  if (respostaTrimmed.length >= 5) {
    return {
      status: "válida_curta",
      valid: true,
    };
  }

  return {
    status: "incompreensível",
    valid: false,
    feedback:
      "Não consegui processar a tua resposta. Consegues tentar novamente com mais detalhe?",
  };
}

/**
 * Retorna true se após X tentativas falhadas consecutivas, deve-se auto-preencher
 */
export function deveAutoPreencherResposta(
  tentativasConsecutivas: number,
): boolean {
  // Após 4 tentativas falhadas, auto-preenche com "Não respondida"
  return tentativasConsecutivas >= 4;
}

/**
 * Estratégia de resposta padrão quando utilizador não consegue responder
 */
export function obterRespostaAutoPreenchida(pergunta: string): string {
  // Se pergunta é sobre experiência/conhecimento, resposta padrão
  if (/projeto|desenvolveu|experiência|trabalhou|fiz/i.test(pergunta)) {
    return "Não foi fornecida resposta específica";
  }
  if (/email|telefone|telemóvel|contacto/i.test(pergunta)) {
    return "Informação de contacto não fornecida";
  }
  if (/nível|nota|conhecimento/i.test(pergunta)) {
    return "Nível não especificado";
  }

  return "Resposta não fornecida";
}
