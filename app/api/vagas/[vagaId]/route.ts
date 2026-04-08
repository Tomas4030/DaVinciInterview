// app/api/vagas/[vagaId]/route.ts
// GET    /api/vagas/[vagaId] → obtém vaga por ID (MockAPI)
// PUT    /api/vagas/[vagaId] → actualiza vaga (MockAPI, requer auth)
// DELETE /api/vagas/[vagaId] → apaga vaga (MockAPI, requer auth)

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;

interface Params {
  params: { vagaId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas/${params.vagaId}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 },
      );
    }

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vaga = await response.json();

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

    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas/${params.vagaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const data = await response.json();

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

    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas/${params.vagaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/vagas/[vagaId]]", error);
    return NextResponse.json({ error: "Erro ao apagar vaga" }, { status: 500 });
  }
}
