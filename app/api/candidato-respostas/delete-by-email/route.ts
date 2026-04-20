// app/api/candidato-respostas/delete-by-email/route.ts
// DELETE /api/candidato-respostas/delete-by-email
// Apaga todas as respostas de um utilizador

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deletarCandidaturasPorEmail } from "@/lib/queries/candidato-respostas";
import { getAdminCompanyContextFromRequest } from "@/lib/admin-context";

interface RequestBody {
  email: string;
  vagaId?: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body: RequestBody = await request.json();
    const { email, vagaId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedVagaId = vagaId ? String(vagaId).trim() : undefined;

    // Apagar apenas as respostas desta candidatura
    const count = await deletarCandidaturasPorEmail(
      normalizedEmail,
      context.company.id,
      normalizedVagaId,
    );

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
