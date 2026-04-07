// app/api/candidatos/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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

    const supabase = createServerClient();

    // Verificar se já existe candidatura com estes dados
    const { data: existing, error } = await (supabase as any)
      .from("candidacies")
      .select("*")
      .eq("email", email)
      .eq("telefone", telefone)
      .eq("vaga_id", vaga_id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = não encontrou registos
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
