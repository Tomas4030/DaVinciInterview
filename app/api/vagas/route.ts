// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas ativas (proxy MockAPI)
// POST /api/vagas    → cria nova vaga (requer auth admin)

import { NextRequest, NextResponse } from "next/server";

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;

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

export async function GET(request: NextRequest) {
  try {
    if (!MOCKAPI_ENDPOINT) {
      return NextResponse.json(
        { error: "API endpoint not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas`);

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
    const authHeader = request.headers.get("authorization");
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
