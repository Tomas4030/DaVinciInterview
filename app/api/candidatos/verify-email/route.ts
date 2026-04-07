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
    const normalizedEmail = String(email).trim().toLowerCase();
    const redirectBase =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = `${redirectBase}/entrevista/verify`;

    // Enviar magic link para verificação de email
    let { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Em produção, a URL pode não estar na allow-list do Supabase.
    // Se isso acontecer, tentar novamente sem emailRedirectTo.
    if (
      error &&
      /redirect|allow.?list|allowed|invalid.*url/i.test(error.message || "")
    ) {
      const retry = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
      });
      error = retry.error;
    }

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
