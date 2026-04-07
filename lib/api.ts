// lib/api.ts
// Toda a lógica de acesso a dados via Supabase.
// Substitui o backend FastAPI — a app Next.js comunica diretamente com o Supabase.

import { createServerClient } from "./supabase-server";
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
  sessao_id: string;
  vaga_id: string;
  pergunta_id: number;
  resposta: string;
  criada_em: string;
}

export interface SessaoComRespostas {
  sessao_id: string;
  vaga_id: string;
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
export async function listarVagas(): Promise<VagaResumo[]> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from("vagas")
    .select(
      "id, titulo, descricao, modalidade, duracao_min, ativa, criada_em, perguntas",
    )
    .order("criada_em", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((v: any) => ({
    id: v.id,
    titulo: v.titulo,
    descricao: v.descricao ?? "",
    modalidade: v.modalidade,
    duracao_min: v.duracao_min,
    total_perguntas: Array.isArray(v.perguntas) ? v.perguntas.length : 0,
    ativa: v.ativa,
    criada_em: v.criada_em,
  }));
}

/** Lista apenas vagas ativas para os candidatos (Mock API) */
export async function listarVagasAtivas(): Promise<VagaResumo[]> {
  try {
    // Tentar fetch via API route primeiro (para cliente)
    // Se falhar (SSR), usar mock-api diretamente
    if (typeof window === "undefined") {
      // Server-side: usar mock-api diretamente
      const { getAllVagas } = await import("./mock-api");
      const vagas = await getAllVagas();

      return vagas.map((v: any) => ({
        id: v.id,
        titulo: v.titulo,
        descricao: v.descricao ?? "",
        modalidade: v.modalidade,
        duracao_min: v.duracao_min,
        total_perguntas: v.perguntas?.length || 0,
        ativa: v.ativa,
        criada_em: v.criada_em,
      }));
    }

    // Client-side: usar API route
    const response = await fetch(`${getAppBaseUrl()}/api/vagas`, {
      next: { revalidate: 60 }, // Cache por 60 segundos
    });

    if (!response.ok) {
      throw new Error("Erro ao listar vagas");
    }

    const json = await response.json();
    const vagas = json.data || json;

    return (Array.isArray(vagas) ? vagas : []).map((v: any) => ({
      id: v.id,
      titulo: v.titulo,
      descricao: v.descricao ?? "",
      modalidade: v.modalidade,
      duracao_min: v.duracao_min,
      total_perguntas: v.total_perguntas,
      ativa: v.ativa,
      criada_em: v.criada_em,
    }));
  } catch (error) {
    console.error("Erro ao listar vagas da Mock API:", error);
    return [];
  }
}

/** Obtém uma vaga completa (com perguntas) por ID (Mock API) */
export async function obterVaga(vagaId: string): Promise<Vaga> {
  try {
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
  const supabase = createServerClient() as any;
  const { count, error } = await supabase
    .from("respostas")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

/** Lista sessões únicas com as suas respostas (para admin) */
export async function listarSessoes(
  vagaId?: string,
): Promise<SessaoComRespostas[]> {
  const supabase = createServerClient() as any;

  let query = supabase
    .from("respostas")
    .select("*")
    .order("criada_em", { ascending: false });

  if (vagaId) query = query.eq("vaga_id", vagaId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Agrupa por sessao_id
  const mapa = new Map<string, SessaoComRespostas>();
  for (const r of data ?? []) {
    if (!mapa.has(r.sessao_id)) {
      mapa.set(r.sessao_id, {
        sessao_id: r.sessao_id,
        vaga_id: r.vaga_id,
        respostas: [],
        criada_em: r.criada_em,
      });
    }
    mapa.get(r.sessao_id)!.respostas.push(r as Resposta);
  }

  return Array.from(mapa.values());
}
