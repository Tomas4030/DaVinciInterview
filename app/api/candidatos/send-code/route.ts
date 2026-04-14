import { NextRequest, NextResponse } from "next/server";
import { criarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { verificarDuplicata } from "@/lib/queries/candidatos";

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

    // Verificar se já existe candidatura
    const temDuplicata = await verificarDuplicata(
      normalizedEmail,
      normalizedPhone,
      vaga_id,
    );

    if (temDuplicata) {
      return NextResponse.json(
        { error: "Já existe uma candidatura para esta vaga com estes dados" },
        { status: 409 },
      );
    }

    // Criar código verification
    const codigo = await criarCodigoVerificacao(normalizedEmail);

    // Enviar via Brevo
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
            <p style="font-size:32px;font-weight:bold;letter-spacing:4px">${codigo}</p>
            <p>Este código expira em 15 minutos.</p>
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
