import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// TTL para a sessão de entrevista (em minutos)
const INTERVIEW_SESSION_TTL_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const { email, vaga_id, code, telefone } = await request.json();

    if (!email || !vaga_id || !code) {
      return NextResponse.json(
        { error: "Email, vaga_id e código são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

    const { data, error } = await supabase
      .from("candidato_email_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("vaga_id", vaga_id)
      .eq("code", normalizedCode)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Erro ao verificar código" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Código expirado" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("candidato_email_codes")
      .update({ used: true })
      .eq("id", data.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: "Erro ao finalizar verificação" },
        { status: 500 },
      );
    }

    // Gerar sessão de entrevista com TTL
    const sessionToken = randomUUID();
    const expiresAt = new Date(
      Date.now() + INTERVIEW_SESSION_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    const { error: sessionError } = await supabase
      .from("candidato_entrevista_sessions")
      .insert({
        session_token: sessionToken,
        email: normalizedEmail,
        telefone: telefone || "",
        vaga_id,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error("Erro ao criar sessão:", sessionError);
      // Não falhar — a verificação foi bem-sucedida, apenas sem persistência de sessão
      return NextResponse.json({
        success: true,
        message: "Email verificado com sucesso",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso",
      sessionToken,
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
