// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas ativas (Mock API)
// POST /api/vagas    → cria nova vaga (requer auth admin)

import { NextRequest, NextResponse } from "next/server";
import { getAllVagas, addVaga } from "@/lib/mock-api";

export async function GET() {
  try {
    const vagas = await getAllVagas();

    // Adicionar contagem de perguntas
    const vagasFormatadas = vagas.map((v) => ({
      ...v,
      total_perguntas: v.perguntas.length,
    }));

    return NextResponse.json(vagasFormatadas);
  } catch (error) {
    console.error("Erro ao listar vagas:", error);
    return NextResponse.json(
      { error: "Erro ao listar vagas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let isAdmin = false;

    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      isAdmin = decoded.role === "admin";
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Apenas admin pode criar vagas" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, titulo, descricao, modalidade, duracao_min, perguntas } = body;

    // Validação básica
    if (!id || !titulo) {
      return NextResponse.json(
        { error: "ID e título são obrigatórios" },
        { status: 400 },
      );
    }

    const newVaga = {
      id,
      titulo,
      descricao: descricao || "",
      modalidade: modalidade || "Remoto",
      duracao_min: duracao_min || 15,
      ativa: true,
      criada_em: new Date().toISOString(),
      perguntas: perguntas || [],
    };

    await addVaga(newVaga);

    return NextResponse.json(newVaga, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar vaga:", error);
    return NextResponse.json({ error: "Erro ao criar vaga" }, { status: 500 });
  }
}
