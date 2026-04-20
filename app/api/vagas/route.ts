// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas (DB MySQL)
// POST /api/vagas    → cria nova vaga (requer auth admin)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminCompanyContextFromRequest } from "@/lib/admin-context";
import {
  criarVagaRegistro,
  listarVagasPorCompanyRegistro,
} from "@/lib/queries/vagas";

export async function GET(request: NextRequest) {
  try {
    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const vagas = await listarVagasPorCompanyRegistro(context.company.id);

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
    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
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
      company_id: context.company.id,
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
