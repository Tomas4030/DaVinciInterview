// app/api/candidato-respostas/delete-by-email/route.ts
// DELETE /api/candidato-respostas/delete-by-email
// Apaga todas as respostas de um utilizador

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deletarCandidaturasPorEmail } from "@/lib/queries/candidato-respostas";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";

interface RequestBody {
  email: string;
  vagaId?: string;
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = parseAdminToken(token);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body: RequestBody = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Apagar todas as respostas deste utilizador
    const count = await deletarCandidaturasPorEmail(normalizedEmail);

    // Limpar cache
    revalidatePath("/admin/respostas");

    return NextResponse.json({
      success: true,
      message: `${count} candidatura(s) de ${email} apagada(s) com sucesso`,
      deleted: count,
    });
  } catch (error) {
    console.error("[DELETE /api/candidato-respostas/delete-by-email]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
