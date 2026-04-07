// app/api/vagas/[vagaId]/route.ts
// GET    /api/vagas/[vagaId] → obtém vaga por ID (MockAPI)
// PUT    /api/vagas/[vagaId] → actualiza vaga (MockAPI, requer auth)
// DELETE /api/vagas/[vagaId] → apaga vaga (MockAPI, requer auth)

import { NextRequest, NextResponse } from "next/server";

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;

interface Params {
  params: { vagaId: string };
}

/**
 * Extrai token do header Authorization
 * Formato: "Bearer <token>"
 */
function extractAuthToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
}

/**
 * Valida token admin
 * Token = base64("email:password")
 */
function validateAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, password] = decoded.split(":");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    return email === adminEmail && password === adminPassword;
  } catch {
    return false;
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas/${params.vagaId}`);

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
    const authHeader = req.headers.get("authorization");
    const token = extractAuthToken(authHeader);

    if (!token || !validateAdminToken(token)) {
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
    const authHeader = _req.headers.get("authorization");
    const token = extractAuthToken(authHeader);

    if (!token || !validateAdminToken(token)) {
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
