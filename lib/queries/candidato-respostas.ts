/**
 * lib/queries/candidato-respostas.ts
 * Queries para candidaturas, respostas e histórico
 */

import { query, db, jsonParse, jsonStringify } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface CandidaturaPrincipal {
  id: string;
  email: string;
  telefone: string;
  vaga_id: string;
  sessao_id: string;
  respostas: any[] | null;
  status: "em_progresso" | "concluida" | "rejeitada" | "em_analise";
  email_verificado: boolean;
  criada_em: string;
  atualizada_em: string;
}

/**
 * Cria nova candidatura
 */
export async function criarCandidatura(
  email: string,
  telefone: string,
  vaga_id: string,
  sessao_id: string,
  respostas?: any[],
): Promise<CandidaturaPrincipal> {
  const id = uuidv4();
  const agora = new Date();
  const status =
    respostas && respostas.length > 0 ? "concluida" : "em_progresso";
  const respostasJson = respostas ? jsonStringify(respostas) : null;

  await query(
    `
    INSERT INTO candidato_respostas
    (id, email, telefone, vaga_id, sessao_id, respostas, status, email_verificado, criada_em, atualizada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      email,
      telefone,
      vaga_id,
      sessao_id,
      respostasJson,
      status,
      true,
      agora,
      agora,
    ],
  );

  return {
    id,
    email,
    telefone,
    vaga_id,
    sessao_id,
    respostas: respostas || [],
    status,
    email_verificado: true,
    criada_em: agora.toISOString(),
    atualizada_em: agora.toISOString(),
  };
}

/**
 * Busca candidatura por sessão_id
 */
export async function buscarCandidaturaPorSessao(
  sessao_id: string,
): Promise<CandidaturaPrincipal | null> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_respostas
    WHERE sessao_id = ?
    LIMIT 1
    `,
    [sessao_id],
  );

  const candidaturas = rows as any[];
  if (candidaturas.length === 0) return null;

  const candidatura = candidaturas[0];
  candidatura.respostas = jsonParse(candidatura.respostas);

  return candidatura as CandidaturaPrincipal;
}

/**
 * Busca candidatura por email e vaga
 */
export async function buscarCandidaturaPorEmail(
  email: string,
  vaga_id: string,
): Promise<CandidaturaPrincipal | null> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_respostas
    WHERE email = ? AND vaga_id = ?
    ORDER BY criada_em DESC
    LIMIT 1
    `,
    [email, vaga_id],
  );

  const candidaturas = rows as any[];
  if (candidaturas.length === 0) return null;

  const candidatura = candidaturas[0];
  candidatura.respostas = jsonParse(candidatura.respostas);

  return candidatura as CandidaturaPrincipal;
}

/**
 * Atualiza respostas de uma candidatura
 */
export async function atualizarRespostas(
  sessao_id: string,
  respostas: any[],
): Promise<void> {
  const respostasJson = jsonStringify(respostas);
  const agora = new Date();

  await query(
    `
    UPDATE candidato_respostas
    SET respostas = ?, status = 'concluida', atualizada_em = ?
    WHERE sessao_id = ?
    `,
    [respostasJson, agora, sessao_id],
  );
}

/**
 * Atualiza status de candidatura
 */
export async function atualizarStatusCandidatura(
  sessao_id: string,
  status: string,
): Promise<void> {
  const agora = new Date();

  await query(
    `
    UPDATE candidato_respostas
    SET status = ?, atualizada_em = ?
    WHERE sessao_id = ?
    `,
    [status, agora, sessao_id],
  );
}

/**
 * Deleta todas as candidaturas de um email
 */
export async function deletarCandidaturasPorEmail(
  email: string,
): Promise<number> {
  const result = await query(
    `DELETE FROM candidato_respostas WHERE email = ?`,
    [email],
  );

  return (result[1] as any).affectedRows || 0;
}

/**
 * Lista todas as candidaturas de uma vaga (admin)
 */
export async function listarCandidaturasVaga(
  vaga_id: string,
): Promise<CandidaturaPrincipal[]> {
  const [rows] = await query(
    `
    SELECT * FROM candidato_respostas
    WHERE vaga_id = ?
    ORDER BY criada_em DESC
    `,
    [vaga_id],
  );

  return (rows as any[]).map((candidatura) => {
    candidatura.respostas = jsonParse(candidatura.respostas);
    return candidatura as CandidaturaPrincipal;
  });
}

/**
 * Conta candidaturas por status
 */
export async function contarCandidaturasPorStatus(
  vaga_id: string,
): Promise<{ status: string; count: number }[]> {
  const [rows] = await query(
    `
    SELECT status, COUNT(*) as count
    FROM candidato_respostas
    WHERE vaga_id = ?
    GROUP BY status
    `,
    [vaga_id],
  );

  return rows as { status: string; count: number }[];
}
