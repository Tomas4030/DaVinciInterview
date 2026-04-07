// app/api/candidatos/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Enviar magic link para verificação de email
    const { error } = await (supabase as any).auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/entrevista/verify`,
      },
    });

    if (error) {
      console.error("Erro ao enviar email de verificação:", error);
      return NextResponse.json(
        { error: "Erro ao enviar email de verificação" },
        { status: 500 },
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
