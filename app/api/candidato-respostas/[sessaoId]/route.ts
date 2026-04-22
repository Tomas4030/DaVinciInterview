// app/api/candidato-respostas/[sessaoId]/route.ts
// GET /api/candidato-respostas/[sessaoId] → obter candidatura (admin)
// POST /api/candidato-respostas/[sessaoId] → adicionar resposta

import { NextRequest, NextResponse } from "next/server";
import {
  buscarCandidaturaPorSessao,
  atualizarRespostas as atualizarRespostasBD,
} from "@/lib/queries/candidato-respostas";
import { getAdminCompanyContextFromRequest } from "@/lib/admin-context";

interface Resposta {
  pergunta_id: number;
  texto_pergunta: string;
  resposta_texto: string;
  duracao_segundos: number;
  timestamp: string;
}

interface UpdatePOST {
  resposta: Resposta;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessaoId: string } },
) {
  try {
    const sessaoId = params.sessaoId;

    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidatura = await buscarCandidaturaPorSessao(
      sessaoId,
      context.company.id,
    );

    if (!candidatura) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: candidatura,
    });
  } catch (err) {
    console.error("[GET /api/candidato-respostas/[sessaoId]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessaoId: string } },
) {
  try {
    const sessaoId = params.sessaoId;
    const body: UpdatePOST = await request.json();
    const { resposta } = body;

    const context = await getAdminCompanyContextFromRequest(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resposta) {
      return NextResponse.json(
        { error: "Missing resposta field" },
        { status: 400 },
      );
    }

    // Obter candidatura
    const candidatura = await buscarCandidaturaPorSessao(
      sessaoId,
      context.company.id,
    );

    if (!candidatura) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 },
      );
    }

    // Adicionar resposta ao array
    const respostasAtuais = candidatura.respostas || [];
    const respostasUpdated = respostasAtuais.map((r: Resposta) =>
      r.pergunta_id === resposta.pergunta_id ? resposta : r,
    );

    // Se não existe, adiciona
    if (
      !respostasUpdated.some(
        (r: Resposta) => r.pergunta_id === resposta.pergunta_id,
      )
    ) {
      respostasUpdated.push(resposta);
    }

    // Atualizar
    await atualizarRespostasBD(sessaoId, context.company.id, respostasUpdated);

    const candidaturaUpdated = await buscarCandidaturaPorSessao(
      sessaoId,
      context.company.id,
    );

    return NextResponse.json({
      success: true,
      data: candidaturaUpdated,
      message: "Resposta guardada com sucesso!",
    });
  } catch (err) {
    console.error("[POST /api/candidato-respostas/[sessaoId]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
