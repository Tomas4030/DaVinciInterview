// app/api/candidatos/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, telefone, vaga_id } = await request.json();

    // Validação básica
    if (!email || !telefone || !vaga_id) {
      return NextResponse.json(
        { error: "Email, telefone e vaga_id são obrigatórios" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase não configurado no servidor" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(telefone).trim();

    // Verificar se já existe candidatura com estes dados
    const { data: existing, error } = await supabase
      .from("candidato_respostas")
      .select("id, status, criada_em")
      .eq("email", normalizedEmail)
      .eq("telefone", normalizedPhone)
      .eq("vaga_id", vaga_id)
      .order("criada_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar candidatura:", error);
      return NextResponse.json(
        { error: "Erro ao verificar candidatura" },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json({
        exists: true,
        message: "Estamos a analisar a sua candidatura.",
        candidacy: existing,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Erro ao verificar candidatura:", error);
    return NextResponse.json(
      { error: "Erro ao verificar candidatura" },
      { status: 500 },
    );
  }
}
