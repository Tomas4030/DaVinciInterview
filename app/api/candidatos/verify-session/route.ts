// app/api/candidatos/verify-session/route.ts
// POST /api/candidatos/verify-session
// Valida se uma sessão de entrevista ainda é válida

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { sessionToken, vagaId } = await request.json();

    if (!sessionToken || !vagaId) {
      return NextResponse.json(
        { error: "sessionToken e vagaId são obrigatórios" },
        { status: 400 },
      );
    }

    // Buscar a sessão no banco
    const { data, error } = await supabase
      .from("candidato_entrevista_sessions")
      .select("email, telefone, vaga_id, expires_at")
      .eq("session_token", sessionToken)
      .eq("vaga_id", vagaId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar sessão:", error);
      return NextResponse.json(
        { error: "Erro ao verificar sessão" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 },
      );
    }

    // Verificar se a sessão expirou
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (expiresAt.getTime() <= now.getTime()) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    // Sessão válida — retornar dados do candidato
    return NextResponse.json({
      success: true,
      email: data.email,
      telefone: data.telefone,
      vagaId: data.vaga_id,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    console.error("[POST /api/candidatos/verify-session]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
