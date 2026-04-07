// app/api/auth/login-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar credenciais do admin
    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Email ou senha inválidos" },
        { status: 401 },
      );
    }

    // Gerar token simples (em produção, seria JWT real)
    const token = Buffer.from(
      JSON.stringify({
        email,
        role: "admin",
        iat: Date.now(),
      }),
    ).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      admin: {
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login de admin:", error);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
