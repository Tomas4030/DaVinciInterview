// app/api/candidato-respostas-v2/route.ts
/**
 * Endpoints v2 para gerência de respostas com state machine
 *
 * POST /api/candidato-respostas-v2 - Criar sessão de respostas
 * GET /api/candidato-respostas-v2/[sessaoId] - Obter respostas
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FollowUpRecord } from "@/lib/database.types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export interface CriarSessaoRespostasRequest {
  sessao_id: string;
  vaga_id: string;
  email_candidato?: string;
  telefone_candidato?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CriarSessaoRespostasRequest = await request.json();
    const { sessao_id, vaga_id, email_candidato, telefone_candidato } = body;

    if (!sessao_id || !vaga_id) {
      return NextResponse.json(
        { error: "sessao_id e vaga_id são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar se sessão já existe
    const { data: existente } = await supabase
      .from("sessoes_entrevista")
      .select("id")
      .eq("id", sessao_id)
      .single();

    if (existente) {
      return NextResponse.json({ error: "Sessão já existe" }, { status: 409 });
    }

    // Criar nova sessão
    const { data, error } = await supabase
      .from("sessoes_entrevista")
      .insert({
        id: sessao_id,
        vaga_id,
        email_candidato,
        telefone_candidato,
        criada_em: new Date().toISOString(),
        estado: "em_progresso",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Erro ao criar sessão: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Sessão criada com sucesso",
        sessao_id: data.id,
      },
      { status: 201 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/candidato-respostas-v2]", err);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessaoId = request.nextUrl.searchParams.get("sessionId");

    if (!sessaoId) {
      return NextResponse.json(
        { error: "sessionId é obrigatório" },
        { status: 400 },
      );
    }

    // Obter todas as respostas desta sessão que foram guardadas
    const { data, error } = await supabase
      .from("candidato_respostas_v2")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("estado", "saved")
      .order("pergunta_id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      total: data?.length || 0,
      respostas: data || [],
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[GET /api/candidato-respostas-v2]", err);
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
