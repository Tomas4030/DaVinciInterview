// app/api/candidato-respostas/route.ts
// POST /api/candidato-respostas → cria uma candidatura com respostas
// Esta é a versão melhorada usando o novo schema

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Resposta {
  pergunta_id: number;
  texto_pergunta: string;
  resposta_texto: string;
  duracao_segundos: number;
  timestamp: string;
}

interface CandidaturaPOST {
  email: string;
  telefone: string;
  vaga_id: string;
  sessao_id: string;
  respostas?: Resposta[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CandidaturaPOST = await request.json();
    const { email, telefone, vaga_id, sessao_id, respostas = [] } = body;

    // Validar campos obrigatórios
    if (!email || !telefone || !vaga_id || !sessao_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: email, telefone, vaga_id, sessao_id",
        },
        { status: 400 },
      );
    }

    // Verificar duplicatas (últimos 90 dias)
    const { data: existing, error: checkError } = await supabase
      .from("candidato_respostas")
      .select("id")
      .eq("email", email)
      .eq("telefone", telefone)
      .eq("vaga_id", vaga_id)
      .gte(
        "criada_em",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (checkError) {
      console.error("[Check duplicata error]", checkError);
      return NextResponse.json(
        { error: "Erro ao verificar candidatura" },
        { status: 500 },
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "Você já se candidatou a esta vaga nos últimos 90 dias",
          exists: true,
        },
        { status: 409 },
      );
    }

    // Guardar no Supabase
    const { data, error } = await supabase
      .from("candidato_respostas")
      .insert([
        {
          email,
          telefone,
          vaga_id,
          sessao_id,
          respostas,
          status: respostas.length > 0 ? "concluida" : "em_progresso",
          email_verificado: false,
        },
      ])
      .select();

    if (error) {
      console.error("[Supabase error]", error);

      // Se erro for de unicidade de sessao_id
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Sessão já existe ou candidatura duplicada" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to save candidacy" },
        { status: 500 },
      );
    }

    // Limpar cache da página de respostas
    revalidatePath("/admin/respostas");

    return NextResponse.json(
      {
        success: true,
        data: data?.[0],
        message: "Candidatura guardada com sucesso!",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/candidato-respostas]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar validação de admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Listar todas as candidaturas (apenas para admin)
    const { data, error } = await supabase
      .from("candidato_respostas")
      .select("*")
      .order("criada_em", { ascending: false });

    if (error) {
      console.error("[Supabase error]", error);
      return NextResponse.json(
        { error: "Failed to fetch candidaturas" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0,
    });
  } catch (err) {
    console.error("[GET /api/candidato-respostas]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
