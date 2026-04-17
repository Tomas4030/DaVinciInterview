// lib/api.ts
// Toda a lógica de acesso a dados via MySQL.
// Comunica via queries layer (lib/queries/)
import type { Pergunta } from "./database.types";
import { withBasePath } from "./base-path";

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type { Pergunta };

export interface VagaResumo {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: string;
  duracao_min: number;
  total_perguntas: number;
  ativa: boolean;
  criada_em: string;
}

export interface Vaga {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: string;
  duracao_min: number;
  perguntas: Pergunta[];
  ativa: boolean;
}

export interface Resposta {
  id: string;
  pergunta_id: number;
  texto_pergunta?: string;
  resposta: string;
  criada_em?: string;
}

export interface SessaoComRespostas {
  id: string;
  sessao_id: string;
  vaga_id: string;
  email?: string;
  telefone?: string;
  status?: string;
  respostas: Resposta[];
  criada_em: string;
}

// ─── Vagas ────────────────────────────────────────────────────────────────────

/** Lista todas as vagas ativas (usado no homepage e admin) */
/** Lista todas as vagas (admin) via MockAPI */
export async function listarVagas(): Promise<VagaResumo[]> {
  try {
    let vagas: any[] = [];

    if (typeof window === "undefined") {
      // Server-side
      const { getAllVagas } = await import("./mock-api");
      vagas = await getAllVagas();
    } else {
      // Client-side
      const response = await fetch(withBasePath("/api/vagas"), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Erro ao listar vagas");
      }

      const json = await response.json();
      vagas = json.data || json;
    }

    return (Array.isArray(vagas) ? vagas : []).map((v: any) => ({
      id: v.id,
      titulo: v.titulo,
      descricao: v.descricao ?? "",
      modalidade: v.modalidade,
      duracao_min: v.duracao_min,
      total_perguntas: Array.isArray(v.perguntas) ? v.perguntas.length : 0,
      ativa: v.ativa,
      criada_em: v.criada_em ?? v.createdAt ?? new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Erro ao listar vagas da Mock API:", error);
    return [];
  }
}

/** Lista apenas vagas ativas para os candidatos (Mock API) */
export async function listarVagasAtivas(): Promise<VagaResumo[]> {
  try {
    let vagas: any[] = [];

    if (typeof window === "undefined") {
      const { getAllVagas } = await import("./mock-api");
      vagas = await getAllVagas();
    } else {
      const response = await fetch(withBasePath("/api/vagas"), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Erro ao listar vagas");
      }

      const json = await response.json();
      vagas = json.data || json;
    }

    return (Array.isArray(vagas) ? vagas : [])
      .filter((v: any) => v.ativa)
      .map((v: any) => ({
        id: v.id,
        titulo: v.titulo,
        descricao: v.descricao ?? "",
        modalidade: v.modalidade,
        duracao_min: v.duracao_min,
        total_perguntas: Array.isArray(v.perguntas) ? v.perguntas.length : 0,
        ativa: v.ativa,
        criada_em: v.criada_em ?? v.createdAt ?? new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Erro ao listar vagas da Mock API:", error);
    return [];
  }
}

/** Obtém uma vaga completa (com perguntas) por ID (Mock API) */
export async function obterVaga(vagaId: string): Promise<Vaga> {
  try {
    if (typeof window === "undefined") {
      const { getVagaById } = await import("./mock-api");
      const vaga = await getVagaById(vagaId);

      if (!vaga) {
        throw new Error("Vaga não encontrada");
      }

      return {
        id: vaga.id,
        titulo: vaga.titulo,
        descricao: vaga.descricao ?? "",
        modalidade: vaga.modalidade,
        duracao_min: vaga.duracao_min,
        perguntas: Array.isArray(vaga.perguntas)
          ? (vaga.perguntas as Pergunta[])
          : [],
        ativa: vaga.ativa,
      };
    }

    const response = await fetch(withBasePath(`/api/vagas/${vagaId}`), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("Erro ao obter vaga");
    }

    const json = await response.json();
    const vaga = json.data || json;

    if (!vaga) {
      throw new Error("Vaga não encontrada");
    }

    return {
      id: vaga.id,
      titulo: vaga.titulo,
      descricao: vaga.descricao ?? "",
      modalidade: vaga.modalidade,
      duracao_min: vaga.duracao_min,
      perguntas: Array.isArray(vaga.perguntas)
        ? (vaga.perguntas as Pergunta[])
        : [],
      ativa: vaga.ativa,
    };
  } catch (error) {
    console.error("Erro ao obter vaga da Mock API:", error);
    throw new Error("Vaga não encontrada");
  }
}

// ─── Respostas ────────────────────────────────────────────────────────────────

/** Conta o total de respostas guardadas (para o dashboard admin) */
export async function contarRespostas(): Promise<number> {
  try {
    const { query: dbQuery } = await import("./db");
    const [rows] = await dbQuery(
      `SELECT COUNT(*) as total FROM candidato_respostas`,
    );
    return rows[0]?.total || 0;
  } catch (error) {
    console.error("Erro ao contar candidaturas:", error);
    return 0;
  }
}

/** Lista sessões únicas com as suas respostas (para admin) */
export async function listarSessoes(
  vagaId?: string,
): Promise<SessaoComRespostas[]> {
  try {
    const { listarCandidaturasVaga } =
      await import("./queries/candidato-respostas");
    const { query } = await import("./db");

    let candidaturas;
    if (vagaId) {
      candidaturas = await listarCandidaturasVaga(vagaId);
    } else {
      // Listar todas as candidaturas
      const [rows] = await query(
        `SELECT * FROM candidato_respostas ORDER BY criada_em DESC`,
      );
      candidaturas = rows;
    }

    return candidaturas.map((item: any) => ({
      id: item.id,
      sessao_id: item.sessao_id,
      vaga_id: item.vaga_id,
      email: item.email,
      telefone: item.telefone,
      status: item.status,
      criada_em: item.criada_em,
      respostas: Array.isArray(item.respostas)
        ? item.respostas.map((r: any, index: number) => ({
            id: `${item.id}-${r.pergunta_id ?? index}`,
            pergunta_id: r.pergunta_id ?? index + 1,
            texto_pergunta: r.texto_pergunta ?? "",
            resposta: r.resposta_texto ?? "",
            criada_em: r.timestamp ?? item.criada_em,
          }))
        : [],
    }));
  } catch (error) {
    console.error("Erro ao listar sessões:", error);
    throw new Error("Erro ao listar sessões");
  }
}
