import { NextRequest, NextResponse } from "next/server";
import { criarCodigoVerificacao } from "@/lib/queries/verification-codes";
import { verificarDuplicata } from "@/lib/queries/candidatos";
import { sendVerificationCodeEmail } from "@/lib/email";

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

    const codigo = await criarCodigoVerificacao(normalizedEmail);

    await sendVerificationCodeEmail(normalizedEmail, codigo);

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao enviar código:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}