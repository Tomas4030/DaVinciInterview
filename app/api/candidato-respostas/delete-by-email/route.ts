// app/api/candidato-respostas/delete-by-email/route.ts
// DELETE /api/candidato-respostas/delete-by-email
// Apaga todas as respostas de um utilizador para uma vaga específica

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface RequestBody {
  email: string;
  vagaId: string;
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
    const { email, vagaId } = body;

    if (!email || !vagaId) {
      return NextResponse.json(
        { error: "Email e vagaId são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Apagar todas as respostas this utilizador para esta vaga
    const { data, error } = await supabase
      .from("candidato_respostas")
      .delete()
      .eq("email", normalizedEmail)
      .eq("vaga_id", vagaId);

    if (error) {
      console.error("[DELETE respostas error]", error);
      return NextResponse.json(
        { error: "Erro ao apagar respostas" },
        { status: 500 },
      );
    }

    // Limpar cache
    revalidatePath("/admin/respostas");

    return NextResponse.json({
      success: true,
      message: `Respostas de ${email} apagadas com sucesso`,
    });
  } catch (error) {
    console.error("[DELETE /api/candidato-respostas/delete-by-email]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
