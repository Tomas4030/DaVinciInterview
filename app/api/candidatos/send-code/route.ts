import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email, telefone, vaga_id } = await request.json();

    if (!email || !telefone || !vaga_id) {
      return NextResponse.json(
        { error: "Email, telefone e vaga_id são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(telefone).trim();

    const { data: existing, error: checkError } = await supabase
      .from("candidato_respostas")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("telefone", normalizedPhone)
      .eq("vaga_id", vaga_id)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        { error: "Erro ao verificar candidatura" },
        { status: 500 },
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma candidatura para esta vaga com estes dados" },
        { status: 409 },
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("candidato_email_codes")
      .insert({
        email: normalizedEmail,
        vaga_id,
        code,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json(
        { error: "Erro ao guardar código" },
        { status: 500 },
      );
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME!,
          email: process.env.BREVO_SENDER_EMAIL!,
        },
        to: [{ email: normalizedEmail }],
        subject: "Código de verificação",
        htmlContent: `
          <div style="font-family:Arial,sans-serif">
            <h2>Verificação de email</h2>
            <p>O teu código é:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:4px">${code}</p>
            <p>Este código expira em 10 minutos.</p>
          </div>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo error:", errorText);

      return NextResponse.json(
        { error: `Brevo error: ${errorText}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
