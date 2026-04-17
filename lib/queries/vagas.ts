/**
 * lib/queries/vagas.ts
 * Queries para gestão de vagas no MySQL
 */

import { query, jsonParse, jsonStringify } from "@/lib/db";
import type { Pergunta } from "@/lib/database.types";

export interface VagaRegistro {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: string;
  duracao_min: number;
  perguntas: Pergunta[];
  ativa: boolean;
  criada_em: string;
  atualizada_em?: string;
}

function mapVaga(row: any): VagaRegistro {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao ?? "",
    modalidade: row.modalidade,
    duracao_min: Number(row.duracao_min) || 0,
    perguntas: Array.isArray(row.perguntas)
      ? row.perguntas
      : (jsonParse<Pergunta[]>(row.perguntas) ?? []),
    ativa: Boolean(row.ativa),
    criada_em: row.criada_em,
    atualizada_em: row.atualizada_em,
  };
}

export async function listarVagasRegistro(): Promise<VagaRegistro[]> {
  const [rows] = await query(
    `SELECT * FROM vagas ORDER BY criada_em DESC`,
  );

  return (rows as any[]).map(mapVaga);
}

export async function obterVagaRegistro(
  vagaId: string,
): Promise<VagaRegistro | null> {
  const [rows] = await query(
    `SELECT * FROM vagas WHERE id = ? LIMIT 1`,
    [vagaId],
  );

  const vagas = rows as any[];
  if (vagas.length === 0) return null;

  return mapVaga(vagas[0]);
}

export async function listarVagasAtivasRegistro(): Promise<VagaRegistro[]> {
  const [rows] = await query(
    `SELECT * FROM vagas WHERE ativa = 1 ORDER BY criada_em DESC`,
  );

  return (rows as any[]).map(mapVaga);
}

export async function criarVagaRegistro(vaga: Omit<VagaRegistro, "criada_em" | "atualizada_em">): Promise<VagaRegistro> {
  const agora = new Date();

  await query(
    `
    INSERT INTO vagas (id, titulo, descricao, modalidade, duracao_min, perguntas, ativa, criada_em, atualizada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      vaga.id,
      vaga.titulo,
      vaga.descricao ?? "",
      vaga.modalidade,
      vaga.duracao_min,
      jsonStringify(vaga.perguntas ?? []),
      vaga.ativa ? 1 : 0,
      agora,
      agora,
    ],
  );

  return {
    ...vaga,
    criada_em: agora.toISOString(),
    atualizada_em: agora.toISOString(),
  };
}

export async function atualizarVagaRegistro(
  vagaId: string,
  vaga: Partial<Omit<VagaRegistro, "id" | "criada_em" | "atualizada_em">>,
): Promise<VagaRegistro | null> {
  const existente = await obterVagaRegistro(vagaId);
  if (!existente) return null;

  const atualizado = {
    ...existente,
    ...vaga,
    perguntas: vaga.perguntas ?? existente.perguntas,
  };

  await query(
    `
    UPDATE vagas
    SET titulo = ?, descricao = ?, modalidade = ?, duracao_min = ?, perguntas = ?, ativa = ?
    WHERE id = ?
    `,
    [
      atualizado.titulo,
      atualizado.descricao ?? "",
      atualizado.modalidade,
      atualizado.duracao_min,
      jsonStringify(atualizado.perguntas ?? []),
      atualizado.ativa ? 1 : 0,
      vagaId,
    ],
  );

  return await obterVagaRegistro(vagaId);
}

export async function apagarVagaRegistro(vagaId: string): Promise<boolean> {
  const result = await query(`DELETE FROM vagas WHERE id = ?`, [vagaId]);
  return (result[1] as any).affectedRows > 0;
}