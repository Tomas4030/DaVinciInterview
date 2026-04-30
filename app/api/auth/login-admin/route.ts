import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json(
      {
        error:
          "Fluxo atualizado: pede código em /api/auth/email-verification/send e finaliza em /api/auth/email-verification/complete",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error("Erro ao fazer login de admin:", error);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
