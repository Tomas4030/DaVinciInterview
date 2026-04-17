// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas (DB MySQL)
// POST /api/vagas    → cria nova vaga (requer auth admin)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  criarVagaRegistro,
  listarVagasRegistro,
} from "@/lib/queries/vagas";

export async function GET(request: NextRequest) {
  try {
    const vagas = await listarVagasRegistro();

    // Adicionar contagem de perguntas
    const vagasFormatadas = vagas.map((v) => ({
      ...v,
      total_perguntas: v.perguntas?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: vagasFormatadas,
      total: vagasFormatadas.length,
    });
  } catch (error) {
    console.error("[GET /api/vagas]", error);
    return NextResponse.json(
      { error: "Erro ao listar vagas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = parseAdminToken(token);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();

    // Validar campos obrigatórios
    if (!body.id || !body.titulo || !Array.isArray(body.perguntas)) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: id, titulo, perguntas",
        },
        { status: 400 },
      );
    }

    const data = await criarVagaRegistro({
      id: body.id,
      titulo: body.titulo,
      descricao: body.descricao ?? "",
      modalidade: body.modalidade,
      duracao_min: Number(body.duracao_min) || 10,
      perguntas: body.perguntas,
      ativa: Boolean(body.ativa ?? true),
    });

    // Limpar cache da homepage e admin dashboard
    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Vaga criada com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/vagas]", error);
    return NextResponse.json({ error: "Erro ao criar vaga" }, { status: 500 });
  }
}
