/**
 * lib/queries/sessoes.ts
 * Queries para entrevista sessions e rastreamento
 */

import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export interface SessaoEntrevista {
  id: string;
  vaga_id: string;
  email_candidato: string | null;
  telefone_candidato: string | null;
  estado: "em_progresso" | "concluida" | "cancelada";
  criada_em: string;
  concluida_em: string | null;
  duracao_minutos: number | null;
}

/**
 * Cria uma nova sessão de entrevista
 */
export async function criarSessaoEntrevista(vaga_id: string): Promise<string> {
  const id = uuidv4();
  const agora = new Date();

  await query(
    `
    INSERT INTO sessoes_entrevista (id, vaga_id, estado, criada_em)
    VALUES (?, ?, ?, ?)
    `,
    [id, vaga_id, "em_progresso", agora],
  );

  return id;
}

/**
 * Atualiza informações do candidato na sessão
 */
export async function atualizarCandidatoSessao(
  sessao_id: string,
  email: string,
  telefone: string,
): Promise<void> {
  await query(
    `
    UPDATE sessoes_entrevista
    SET email_candidato = ?, telefone_candidato = ?
    WHERE id = ?
    `,
    [email, telefone, sessao_id],
  );
}

/**
 * Busca sessão por ID
 */
export async function buscarSessao(
  id: string,
): Promise<SessaoEntrevista | null> {
  const [rows] = await query(
    `SELECT * FROM sessoes_entrevista WHERE id = ? LIMIT 1`,
    [id],
  );

  return (rows as any[]).length > 0 ? (rows[0] as SessaoEntrevista) : null;
}

/**
 * Marca sessão como concluída
 */
export async function concluirSessao(id: string): Promise<void> {
  const agora = new Date();

  const [existente] = await query(
    `SELECT criada_em FROM sessoes_entrevista WHERE id = ?`,
    [id],
  );

  if ((existente as any[]).length > 0) {
    const sessao = (existente as any[])[0];
    const criada = new Date(sessao.criada_em);
    const duracao = Math.floor(
      (agora.getTime() - criada.getTime()) / 1000 / 60,
    ); // em minutos

    await query(
      `
      UPDATE sessoes_entrevista
      SET estado = ?, concluida_em = ?, duracao_minutos = ?
      WHERE id = ?
      `,
      ["concluida", agora, duracao, id],
    );
  }
}

/**
 * Cancela sessão
 */
export async function cancelarSessao(id: string): Promise<void> {
  const agora = new Date();

  await query(
    `
    UPDATE sessoes_entrevista
    SET estado = ?, concluida_em = ?
    WHERE id = ?
    `,
    ["cancelada", agora, id],
  );
}

/**
 * Lista todas as sessões de uma vaga
 */
export async function listarSessoesPorVaga(
  vaga_id: string,
): Promise<SessaoEntrevista[]> {
  const [rows] = await query(
    `
    SELECT * FROM sessoes_entrevista
    WHERE vaga_id = ?
    ORDER BY criada_em DESC
    `,
    [vaga_id],
  );

  return rows as SessaoEntrevista[];
}

/**
 * Estatísticas de sessões por vaga
 */
export async function estatisticasSessoes(vaga_id: string) {
  const [stats] = await query(
    `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'concluida' THEN 1 ELSE 0 END) as concluidas,
      SUM(CASE WHEN estado = 'em_progresso' THEN 1 ELSE 0 END) as em_progresso,
      SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
      ROUND(AVG(duracao_minutos), 2) as duracao_media_minutos
    FROM sessoes_entrevista
    WHERE vaga_id = ?
    `,
    [vaga_id],
  );

  return stats && (stats as any[])[0] ? (stats as any[])[0] : null;
}
