// app/api/candidato-respostas/route.ts
// POST /api/candidato-respostas → cria uma candidatura com respostas
// GET /api/candidato-respostas → lista todas as candidaturas (admin)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  criarCandidatura,
  listarCandidaturasVaga,
  CandidaturaPrincipal,
} from "@/lib/queries/candidato-respostas";
import { verificarDuplicata } from "@/lib/queries/candidatos";
import { resolveCompanyAndInterviewFromLegacyVaga } from "@/lib/queries/interviews";
import { getAdminCompanyContextFromRequest } from "@/lib/admin-context";

interface Resposta {
  pergunta_id: number;
  texto_pergunta: string;
  resposta_texto: string;
  duracao_segundos: number;
  timestamp: string;
}

interface CandidaturaPOST {
  email: string;
  telefone: string;
  vaga_id: string;
  sessao_id: string;
  respostas?: Resposta[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CandidaturaPOST = await request.json();
    const { email, telefone, vaga_id, sessao_id, respostas = [] } = body;

    // Validar campos obrigatórios
    if (!email || !telefone || !vaga_id || !sessao_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: email, telefone, vaga_id, sessao_id",
        },
        { status: 400 },
      );
    }

    // Verificar duplicatas (últimos 90 dias)
    const scope = await resolveCompanyAndInterviewFromLegacyVaga(vaga_id);
    if (!scope) {
      return NextResponse.json(
        { error: "Entrevista inválida para este identificador de vaga" },
        { status: 400 },
      );
    }

    const temDuplicata = await verificarDuplicata(
      email,
      telefone,
      scope.companyId,
      scope.interviewId,
    );

    if (temDuplicata) {
      return NextResponse.json(
        {
          error: "Você já se candidatou a esta vaga nos últimos 90 dias",
          exists: true,
        },
        { status: 409 },
      );
    }

    // Guardar no MySQL
    const data = await criarCandidatura(
      email,
      telefone,
      scope.companyId,
      scope.interviewId,
      vaga_id,
      sessao_id,
      respostas,
    );

    // Limpar cache da página de respostas
    revalidatePath("/admin/respostas");

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Candidatura guardada com sucesso!",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/candidato-respostas]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extrair vaga_id do query params (opcional)
    const vagaId = new URL(request.url).searchParams.get("vaga_id");

    let data: CandidaturaPrincipal[] = [];
    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (vagaId) {
      data = await listarCandidaturasVaga(vagaId, context.company.id);
    } else {
      const { query } = await import("@/lib/db");
      const [rows] = await query(
        `
        SELECT * FROM candidato_respostas
        WHERE company_id = ?
        ORDER BY criada_em DESC
        `,
        [context.company.id],
      );

      data = rows as CandidaturaPrincipal[];
    }

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0,
    });
  } catch (err) {
    console.error("[GET /api/candidato-respostas]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
