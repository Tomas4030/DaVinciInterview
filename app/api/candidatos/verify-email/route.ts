import { NextRequest, NextResponse } from "next/server";
import { verificarCodigoVerificacao } from "@/lib/queries/verification-codes";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

    const isValid = await verificarCodigoVerificacao(
      normalizedEmail,
      normalizedCode,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao verificar código:", error);
    return NextResponse.json(
      { error: "Erro ao verificar código" },
      { status: 500 },
    );
  }
}
