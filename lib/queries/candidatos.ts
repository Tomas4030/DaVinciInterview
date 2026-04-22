/**
 * lib/queries/candidatos.ts
 * Queries relacionadas a candidatos (verificação, criação de sessão, etc)
 */

import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface CandidatoSessao {
  id: number;
  session_token: string;
  email: string;
  telefone: string;
  vaga_id: string;
  expires_at: string;
  criada_em: string;
}

export interface CandidaturaInfo {
  email: string;
  telefone: string;
  vaga_id: string;
  company_id?: string;
  interview_id?: string;
}

/**
 * Verifica se candidato já se candidatou (últimos 90 dias)
 */
export async function verificarDuplicata(
  email: string,
  telefone: string,
  company_id: string,
  interview_id: string,
): Promise<boolean> {
  const [rows] = await query(
    `
    SELECT id FROM candidato_respostas
    WHERE email = ? AND telefone = ? AND company_id = ? AND interview_id = ?
    AND criada_em >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    LIMIT 1
    `,
    [email, telefone, company_id, interview_id],
  );

  return (rows as any[]).length > 0;
}

/**
 * Cria nova sessão temporária de candidato
 * TTL: 15 minutos
 */
export async function criarSessao(
  email: string,
  telefone: string,
  vaga_id: string,
): Promise<string> {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await query(
    `
    INSERT INTO candidato_entrevista_sessions
    (session_token, email, telefone, vaga_id, expires_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [sessionToken, email, telefone, vaga_id, expiresAt],
  );

  return sessionToken;
}

/**
 * Valida se session token ainda é válido
 */
export async function validarSessao(
  token: string,
): Promise<CandidatoSessao | null> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_entrevista_sessions
    WHERE session_token = ? AND expires_at > NOW()
    LIMIT 1
    `,
    [token],
  );

  const sessoes = rows as any[];
  return sessoes.length > 0 ? (sessoes[0] as CandidatoSessao) : null;
}

/**
 * Remove sessão (após conclusão ou expiração)
 */
export async function removerSessao(token: string): Promise<void> {
  await query(
    `DELETE FROM candidato_entrevista_sessions WHERE session_token = ?`,
    [token],
  );
}

/**
 * Limpa sessões expiradas (pode ser chamado periodicamente)
 */
export async function limparSessoesExpiradas(): Promise<number> {
  const result = await query(
    `DELETE FROM candidato_entrevista_sessions WHERE expires_at <= NOW()`,
  );

  return (result[1] as any).affectedRows || 0;
}

/**
 * Busca informações de uma sessão por token
 */
export async function buscarSessaoPorToken(
  token: string,
): Promise<CandidatoSessao | null> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_entrevista_sessions
    WHERE session_token = ?
    LIMIT 1
    `,
    [token],
  );

  const sessoes = rows as any[];
  return sessoes.length > 0 ? (sessoes[0] as CandidatoSessao) : null;
}
