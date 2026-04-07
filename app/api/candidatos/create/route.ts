// app/api/candidatos/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email, telefone, vaga_id, sessao_id } = await request.json();

    if (!email || !telefone || !vaga_id || !sessao_id) {
      return NextResponse.json(
        { error: "Email, telefone, vaga_id e sessao_id são obrigatórios" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Criar candidatura
    const { data, error } = await (supabase as any)
      .from("candidacies")
      .insert({
        email,
        telefone,
        vaga_id,
        sessao_id,
        email_verificado: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar candidatura:", error);
      return NextResponse.json(
        { error: "Erro ao criar candidatura" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, candidacy: data });
  } catch (error) {
    console.error("Erro ao criar candidatura:", error);
    return NextResponse.json(
      { error: "Erro ao criar candidatura" },
      { status: 500 },
    );
  }
}
