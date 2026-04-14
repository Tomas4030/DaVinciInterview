/**
 * lib/queries/interview-logs.ts
 * Queries para logging de eventos de entrevista
 */

import { query, jsonStringify, jsonParse } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface InterviewLog {
  id: string;
  sessao_id: string | null;
  tipo: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  mensagem: string;
  dados_json: any | null;
  duracao_ms: number | null;
  timestamp: string;
  criada_em: string;
}

/**
 * Insere um novo log de entrevista
 */
export async function criarLog(
  tipo: string,
  severity: "debug" | "info" | "warning" | "error" | "critical",
  mensagem: string,
  sessao_id?: string,
  dados_json?: any,
  duracao_ms?: number,
): Promise<string> {
  const id = uuidv4();
  const agora = new Date();
  const dadosJson = dados_json ? jsonStringify(dados_json) : null;

  await query(
    `
    INSERT INTO interview_logs
    (id, sessao_id, tipo, severity, mensagem, dados_json, duracao_ms, timestamp, criada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      sessao_id || null,
      tipo,
      severity,
      mensagem,
      dadosJson,
      duracao_ms || null,
      agora,
      agora,
    ],
  );

  return id;
}

/**
 * Busca logs de uma sessão
 */
export async function buscarLogsSessao(
  sessao_id: string,
): Promise<InterviewLog[]> {
  const [rows] = await query(
    `
    SELECT * FROM interview_logs
    WHERE sessao_id = ?
    ORDER BY timestamp DESC
    `,
    [sessao_id],
  );

  return (rows as any[]).map((log) => {
    log.dados_json = jsonParse(log.dados_json);
    return log as InterviewLog;
  });
}

/**
 * Busca logs por tipo e severidade
 */
export async function buscarLogsComFiltros(
  tipo?: string,
  severity?: string,
  limite: number = 100,
): Promise<InterviewLog[]> {
  let sql = "SELECT * FROM interview_logs WHERE 1=1";
  const params: any[] = [];

  if (tipo) {
    sql += " AND tipo = ?";
    params.push(tipo);
  }

  if (severity) {
    sql += " AND severity = ?";
    params.push(severity);
  }

  sql += " ORDER BY timestamp DESC LIMIT ?";
  params.push(limite);

  const [rows] = await query(sql, params);

  return (rows as any[]).map((log) => {
    log.dados_json = jsonParse(log.dados_json);
    return log as InterviewLog;
  });
}

/**
 * Deleta logs antigos (older than X days)
 */
export async function deletarLogsAntigos(
  diasAntigos: number = 30,
): Promise<number> {
  const result = await query(
    `
    DELETE FROM interview_logs
    WHERE timestamp <= DATE_SUB(NOW(), INTERVAL ? DAY)
    `,
    [diasAntigos],
  );

  return (result[1] as any).affectedRows || 0;
}

/**
 * Estatísticas de logs
 */
export async function estatisticasLogs(sessao_id?: string) {
  let sql = `
    SELECT
      tipo,
      severity,
      COUNT(*) as count
    FROM interview_logs
  `;
  const params: any[] = [];

  if (sessao_id) {
    sql += " WHERE sessao_id = ?";
    params.push(sessao_id);
  }

  sql += " GROUP BY tipo, severity ORDER BY count DESC";

  const [rows] = await query(sql, params);
  return rows;
}
