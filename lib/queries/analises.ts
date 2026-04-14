/**
 * lib/queries/analises.ts
 * Queries para análises de candidatos e respostas v2
 */

import { query, jsonStringify, jsonParse } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface AnaliseCandidato {
  id: string;
  sessao_id: string;
  vaga_id: string;
  email_candidato: string;
  analisis_json: any;
  score_geral: number;
  recomendacao: "rejeitar" | "talvez" | "aceitar" | "excelente";
  criada_em: string;
  atualizada_em: string;
}

export interface RespostaV2 {
  id: string;
  sessao_id: string;
  vaga_id: string;
  pergunta_id: number;
  resposta_final: string;
  iteration_count: number;
  follow_ups: any[];
  estado: "in_progress" | "completed" | "saved";
  tamanho_resposta: number;
  tempo_resposta_segundos: number;
  qualidade_estimada: "rejeitar" | "minima" | "aceitavel" | "boa" | "excelente";
  tem_exemplos: boolean;
  tem_justificacao: boolean;
  tem_detalhes: boolean;
  tem_conhecimento_tecnico: boolean;
  criada_em: string;
  atualizada_em: string;
}

/**
 * Cria nova análise de candidato
 */
export async function criarAnalise(
  sessao_id: string,
  vaga_id: string,
  email_candidato: string,
  analisis_json: any,
  score_geral: number,
  recomendacao: string,
): Promise<string> {
  const id = uuidv4();
  const agora = new Date();
  const analisJsonStr = jsonStringify(analisis_json);

  await query(
    `
    INSERT INTO analises_entrevista
    (id, sessao_id, vaga_id, email_candidato, analisis_json, score_geral, recomendacao, criada_em, atualizada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      sessao_id,
      vaga_id,
      email_candidato,
      analisJsonStr,
      score_geral,
      recomendacao,
      agora,
      agora,
    ],
  );

  return id;
}

/**
 * Busca análise por sessão
 */
export async function buscarAnalisePorSessao(
  sessao_id: string,
): Promise<AnaliseCandidato | null> {
  const [rows] = await query(
    `
    SELECT * FROM analises_entrevista
    WHERE sessao_id = ?
    LIMIT 1
    `,
    [sessao_id],
  );

  if ((rows as any[]).length === 0) return null;

  const analise = (rows as any[])[0];
  analise.analisis_json = jsonParse(analise.analisis_json);
  return analise as AnaliseCandidato;
}

/**
 * Lista análises de uma vaga com filtros
 */
export async function listarAnalisesVaga(
  vaga_id: string,
  recomendacao?: string,
): Promise<AnaliseCandidato[]> {
  let sql = `SELECT * FROM analises_entrevista WHERE vaga_id = ?`;
  const params: any[] = [vaga_id];

  if (recomendacao) {
    sql += " AND recomendacao = ?";
    params.push(recomendacao);
  }

  sql += " ORDER BY score_geral DESC, criada_em DESC";

  const [rows] = await query(sql, params);

  return (rows as any[]).map((analise) => {
    analise.analisis_json = jsonParse(analise.analisis_json);
    return analise as AnaliseCandidato;
  });
}

/**
 * ==================== RESPOSTAS V2 ====================
 */

/**
 * Cria/atualiza resposta v2
 */
export async function salvarRespostaV2(
  sessao_id: string,
  vaga_id: string,
  pergunta_id: number,
  resposta_final: string,
  qualidade: string,
  propriedades?: {
    tem_exemplos?: boolean;
    tem_justificacao?: boolean;
    tem_detalhes?: boolean;
    tem_conhecimento_tecnico?: boolean;
    tamanho_resposta?: number;
    tempo_resposta_segundos?: number;
  },
): Promise<string> {
  const id = uuidv4();
  const agora = new Date();

  // Tenta UPDATE primeiro
  const [existente] = await query(
    `SELECT id FROM candidato_respostas_v2 WHERE sessao_id = ? AND pergunta_id = ?`,
    [sessao_id, pergunta_id],
  );

  if ((existente as any[]).length > 0) {
    // UPDATE
    await query(
      `
      UPDATE candidato_respostas_v2
      SET resposta_final = ?, qualidade_estimada = ?,
          tem_exemplos = ?, tem_justificacao = ?, tem_detalhes = ?, tem_conhecimento_tecnico = ?,
          tamanho_resposta = ?, tempo_resposta_segundos = ?, estado = ?, atualizada_em = ?
      WHERE sessao_id = ? AND pergunta_id = ?
      `,
      [
        resposta_final,
        qualidade,
        propriedades?.tem_exemplos || false,
        propriedades?.tem_justificacao || false,
        propriedades?.tem_detalhes || false,
        propriedades?.tem_conhecimento_tecnico || false,
        propriedades?.tamanho_resposta || 0,
        propriedades?.tempo_resposta_segundos || 0,
        "completed",
        agora,
        sessao_id,
        pergunta_id,
      ],
    );

    return (existente as any[])[0].id;
  } else {
    // INSERT
    await query(
      `
      INSERT INTO candidato_respostas_v2
      (id, sessao_id, vaga_id, pergunta_id, resposta_final, iteration_count, follow_ups, estado,
       tamanho_resposta, tempo_resposta_segundos, qualidade_estimada,
       tem_exemplos, tem_justificacao, tem_detalhes, tem_conhecimento_tecnico,
       criada_em, atualizada_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        sessao_id,
        vaga_id,
        pergunta_id,
        resposta_final,
        1,
        "[]", // JSON array vazio
        "completed",
        propriedades?.tamanho_resposta || 0,
        propriedades?.tempo_resposta_segundos || 0,
        qualidade,
        propriedades?.tem_exemplos || false,
        propriedades?.tem_justificacao || false,
        propriedades?.tem_detalhes || false,
        propriedades?.tem_conhecimento_tecnico || false,
        agora,
        agora,
      ],
    );

    return id;
  }
}

/**
 * Busca respostas v2 de uma sessão
 */
export async function buscarRespostasV2(
  sessao_id: string,
): Promise<RespostaV2[]> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_respostas_v2
    WHERE sessao_id = ?
    ORDER BY pergunta_id ASC
    `,
    [sessao_id],
  );

  return (rows as any[]).map((resposta) => {
    resposta.follow_ups = jsonParse(resposta.follow_ups) || [];
    return resposta as RespostaV2;
  });
}

/**
 * Resumo/view de sessão com estatísticas
 */
export async function resumoSessao(sessao_id: string) {
  const [result] = await query(
    `
    SELECT
      COUNT(*) as total_respostas,
      SUM(CASE WHEN estado = 'completed' THEN 1 ELSE 0 END) as completadas,
      ROUND(AVG(tamanho_resposta), 0) as tamanho_medio,
      ROUND(AVG(tempo_resposta_segundos), 0) as tempo_medio_segundos,
      SUM(CASE WHEN tem_exemplos THEN 1 ELSE 0 END) as com_exemplos,
      SUM(CASE WHEN tem_conhecimento_tecnico THEN 1 ELSE 0 END) as com_tecnico
    FROM candidato_respostas_v2
    WHERE sessao_id = ?
    `,
    [sessao_id],
  );

  return result && (result as any[])[0] ? (result as any[])[0] : null;
}
