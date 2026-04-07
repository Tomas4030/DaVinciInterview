// app/api/candidatos/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
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

    // Enviar magic link para verificação de email
    const { error } = await supabase.auth.signInWithOtp({
      email: String(email).trim().toLowerCase(),
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/entrevista/verify`,
      },
    });

    if (error) {
      console.error("Erro ao enviar email de verificação:", error);
      return NextResponse.json(
        {
          error: error.message || "Erro ao enviar email de verificação",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de verificação enviado! Verifica o teu email.",
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 },
    );
  }
}
