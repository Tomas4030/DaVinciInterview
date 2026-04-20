// app/api/candidatos/create/route.ts
// POST /api/candidatos/create → cria uma candidatura completa

import { NextRequest, NextResponse } from "next/server";
import { criarCandidatura } from "@/lib/queries/candidato-respostas";
import { verificarDuplicata } from "@/lib/queries/candidatos";
import { formatAnyValidPhoneToE164 } from "@/lib/validation";
import { resolveCompanyAndInterviewFromLegacyVaga } from "@/lib/queries/interviews";

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      telefone,
      vaga_id,
      sessao_id,
      respostas = [],
    } = await request.json();

    // Validar campos obrigatórios
    if (!email || !telefone || !vaga_id || !sessao_id) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: email, telefone, vaga_id, sessao_id",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = formatAnyValidPhoneToE164(String(telefone));

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Número de telemóvel inválido" },
        { status: 400 },
      );
    }

    const scope = await resolveCompanyAndInterviewFromLegacyVaga(vaga_id);
    if (!scope) {
      return NextResponse.json(
        { error: "Entrevista inválida para este identificador de vaga" },
        { status: 400 },
      );
    }

    // Verificar duplicatas (últimos 90 dias)
    const temDuplicata = await verificarDuplicata(
      normalizedEmail,
      normalizedPhone,
      vaga_id,
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

    // Criar candidatura
    const candidatura = await criarCandidatura(
      normalizedEmail,
      normalizedPhone,
      scope.companyId,
      scope.interviewId,
      vaga_id,
      sessao_id,
      respostas,
    );

    return NextResponse.json(
      {
        success: true,
        data: candidatura,
        message: "Candidatura criada com sucesso!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/candidatos/create]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
