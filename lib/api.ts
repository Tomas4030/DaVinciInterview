// lib/api.ts
// Toda a lógica de acesso a dados via Supabase.
// Substitui o backend FastAPI — a app Next.js comunica diretamente com o Supabase.

import { createServerClient } from "./supabase-server";
import { createAdminClient } from "./supabase-admin";
import type { Pergunta } from "./database.types";

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

function getAppBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
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
      const response = await fetch(`${getAppBaseUrl()}/api/vagas`, {
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
      const response = await fetch(`${getAppBaseUrl()}/api/vagas`, {
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

    const response = await fetch(`${getAppBaseUrl()}/api/vagas/${vagaId}`, {
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
  const supabase = createAdminClient() as any;

  const { count, error } = await supabase
    .from("candidato_respostas")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erro ao contar candidaturas:", error);
    return 0;
  }

  return count ?? 0;
}

/** Lista sessões únicas com as suas respostas (para admin) */
export async function listarSessoes(
  vagaId?: string,
): Promise<SessaoComRespostas[]> {
  const supabase = createAdminClient() as any;

  let query = supabase
    .from("candidato_respostas")
    .select("*")
    .order("criada_em", { ascending: false });

  if (vagaId) {
    query = query.eq("vaga_id", vagaId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro Supabase ao listar sessões:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((item: any) => ({
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
}
