// app/api/vagas/[vagaId]/route.ts
// GET    /api/vagas/[vagaId] → obtém vaga por ID (DB MySQL)
// PUT    /api/vagas/[vagaId] → actualiza vaga (DB MySQL, requer auth)
// DELETE /api/vagas/[vagaId] → apaga vaga (DB MySQL, requer auth)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  apagarVagaRegistro,
  obterVagaRegistro,
  atualizarVagaRegistro,
} from "@/lib/queries/vagas";

interface Params {
  params: { vagaId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const vaga = await obterVagaRegistro(params.vagaId);

    if (!vaga) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: vaga,
    });
  } catch (error) {
    console.error("[GET /api/vagas/[vagaId]]", error);
    return NextResponse.json({ error: "Erro ao obter vaga" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Verificar autenticação admin
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = parseAdminToken(token);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const data = await atualizarVagaRegistro(params.vagaId, {
      titulo: body.titulo,
      descricao: body.descricao,
      modalidade: body.modalidade,
      duracao_min: Number(body.duracao_min) || undefined,
      perguntas: body.perguntas,
      ativa: typeof body.ativa === "boolean" ? body.ativa : undefined,
    });

    if (!data) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 },
      );
    }

    // Limpar cache da homepage e admin dashboard
    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[PUT /api/vagas/[vagaId]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar vaga" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    // Verificar autenticação admin
    const token = _req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const admin = parseAdminToken(token);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const deleted = await apagarVagaRegistro(params.vagaId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 },
      );
    }

    // Limpar cache da homepage e admin dashboard
    revalidatePath("/");
    revalidatePath("/admin");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/vagas/[vagaId]]", error);
    return NextResponse.json({ error: "Erro ao apagar vaga" }, { status: 500 });
  }
}
