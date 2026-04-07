/**
 * Exemplo Completo de Endpoint Seguro
 *
 * 📁 Salvar em: app/api/secure-example/route.ts
 *
 * Este arquivo demonstra:
 * - Como acessar variáveis de ambiente de forma segura
 * - Como validar autenticação
 * - Como fazer chamadas ao MockAPI
 * - Como tratar erros
 * - Como retornar dados seguros ao cliente
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================
// 1. VARIÁVEIS DE AMBIENTE (Servidor Apenas)
// ============================================

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validações na inicialização
if (!MOCKAPI_ENDPOINT) {
  console.warn("[SECURITY] MOCKAPI_ENDPOINT not configured");
}

// ============================================
// 2. TIPOS
// ============================================

interface AuthenticatedRequest {
  isAuthenticated: boolean;
  email?: string;
  error?: string;
}

interface MockApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// ============================================
// 3. FUNÇÕES AUXILIARES
// ============================================

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
function validateAdminToken(token: string): AuthenticatedRequest {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, password] = decoded.split(":");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return {
        isAuthenticated: true,
        email,
      };
    }

    return {
      isAuthenticated: false,
      error: "Invalid credentials",
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: "Invalid token format",
    };
  }
}

/**
 * Faz chamada segura ao MockAPI
 */
async function callMockApi<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<MockApiResponse<T>> {
  try {
    if (!MOCKAPI_ENDPOINT) {
      return {
        success: false,
        error: "API endpoint not configured",
        status: 500,
      };
    }

    const url = `${MOCKAPI_ENDPOINT}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[callMockApi]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}

// ============================================
// 4. HANDLERS PÚBLICOS
// ============================================

/**
 * GET /api/secure-example/vagas
 *
 * Descrição: Lista vagas do MockAPI
 * Autenticação: Não requerida (público)
 *
 * @example
 * const res = await fetch('/api/secure-example/vagas');
 * const { data } = await res.json();
 */
export async function GET(request: NextRequest) {
  try {
    // Chamada segura ao MockAPI
    const result = await callMockApi("/vagas");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 },
      );
    }

    // Retorna dados públicos ao cliente
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[GET /api/secure-example]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ============================================
// 5. HANDLERS COM AUTENTICAÇÃO
// ============================================

/**
 * POST /api/secure-example/vagas
 *
 * Descrição: Cria nova vaga no MockAPI
 * Autenticação: REQUERIDA (admin only)
 *
 * @header Authorization: "Bearer <base64(email:password)>"
 * @body { id, titulo, descricao, perguntas[] }
 *
 * @example
 * const token = btoa('admin@davincinterviews.com:DaVinci@2026Secure!');
 * const res = await fetch('/api/secure-example/vagas', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`,
 *   },
 *   body: JSON.stringify({
 *     id: 'novo-cargo',
 *     titulo: 'Novo Cargo',
 *     perguntas: [{ id: 1, texto: 'Pergunta?' }]
 *   })
 * });
 */
export async function POST(request: NextRequest) {
  try {
    // 1. ✅ Valida autenticação
    const authHeader = request.headers.get("authorization");
    const token = extractAuthToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const auth = validateAdminToken(token);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 403 },
      );
    }

    // 2. ✅ Lê body
    const body = await request.json();

    // 3. ✅ Valida dados obrigatórios
    const requiredFields = ["id", "titulo", "perguntas"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 4. ✅ Valida estrutura de perguntas
    if (!Array.isArray(body.perguntas) || body.perguntas.length === 0) {
      return NextResponse.json(
        { error: "perguntas must be a non-empty array" },
        { status: 400 },
      );
    }

    // 5. ✅ Log de auditoria (opcional mas recomendado)
    console.log(`[AUDIT] Admin ${auth.email} criou vaga: ${body.id}`);

    // 6. ✅ Chamada segura ao MockAPI
    const result = await callMockApi("/vagas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 },
      );
    }

    // 7. ✅ Retorna resposta ao cliente
    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Vaga criada com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/secure-example]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/secure-example/vagas/[id]
 *
 * Descrição: Remove vaga do MockAPI
 * Autenticação: REQUERIDA (admin only)
 *
 * @example
 * const token = btoa('admin@davincinterviews.com:DaVinci@2026Secure!');
 * const res = await fetch('/api/secure-example/vagas/vaga-id', {
 *   method: 'DELETE',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *   }
 * });
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. ✅ Valida autenticação
    const authHeader = request.headers.get("authorization");
    const token = extractAuthToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const auth = validateAdminToken(token);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. ✅ Extrai ID do URL
    const url = new URL(request.url);
    const vagaId = url.pathname.split("/").pop();

    if (!vagaId) {
      return NextResponse.json({ error: "Missing vaga ID" }, { status: 400 });
    }

    // 3. ✅ Log de auditoria
    console.log(`[AUDIT] Admin ${auth.email} deletou vaga: ${vagaId}`);

    // 4. ✅ Chamada segura ao MockAPI
    const result = await callMockApi(`/vagas/${vagaId}`, {
      method: "DELETE",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vaga removida com sucesso",
    });
  } catch (error) {
    console.error("[DELETE /api/secure-example]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ============================================
// 6. HELPER PARA GERAR TOKEN NO CLIENTE
// ============================================

/**
 * Use isto no cliente para gerar token
 *
 * @example
 * const token = generateAdminToken(
 *   'admin@davincinterviews.com',
 *   'DaVinci@2026Secure!'
 * );
 *
 * // NO SERVIDOR:
 * export function generateAdminToken(email: string, password: string): string {
 *   return Buffer.from(`${email}:${password}`).toString('base64');
 * }
 */
