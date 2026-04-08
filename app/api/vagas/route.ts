// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas ativas (proxy MockAPI)
// POST /api/vagas    → cria nova vaga (requer auth admin)

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;

export async function GET(request: NextRequest) {
  try {
    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vagas = await response.json();

    // Adicionar contagem de perguntas
    const vagasFormatadas = Array.isArray(vagas)
      ? vagas.map((v) => ({
          ...v,
          total_perguntas: v.perguntas?.length || 0,
        }))
      : [];

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

    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
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

    // Chamar MockAPI
    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const data = await response.json();

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
