// app/api/candidatos/create/route.ts
// POST /api/candidatos/create → cria uma candidatura completa

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      telefone,
      vaga_id,
      sessao_id,
      respostas = [],
    } = await request.json();

    // Validar campos obrigatórios
    if (!email || !telefone || !vaga_id || !sessao_id) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: email, telefone, vaga_id, sessao_id",
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

    // Criar candidatura
    const { data, error } = await supabase
      .from("candidato_respostas")
      .insert({
        email,
        telefone,
        vaga_id,
        sessao_id,
        respostas,
        status: respostas.length > 0 ? "concluida" : "em_progresso",
        email_verificado: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase error]", error);

      // Se erro for de unicidade de sessao_id, a candidatura já existe
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Sessão já existe" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Erro ao criar candidatura" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Candidatura criada com sucesso!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/candidatos/create]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
