// app/api/analise/comparar-candidatos/route.ts
/**
 * POST /api/analise/comparar-candidatos
 *
 * Compara vários candidatos numa mesma vaga
 * Retorna ranking, destaques e análise comparativa
 */

import { NextRequest, NextResponse } from "next/server";
import { compararCandidatos } from "@/lib/analysis-engine";
import { listarAnalisesVaga } from "@/lib/queries/analises";
import { jsonParse } from "@/lib/db";

export interface CompararCandidatosRequest {
  vaga_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompararCandidatosRequest = await request.json();
    const { vaga_id } = body;

    if (!vaga_id) {
      return NextResponse.json(
        { sucesso: false, erro: "vaga_id é obrigatório" },
        { status: 400 },
      );
    }

    // Obter todas as análises para esta vaga
    const analises = await listarAnalisesVaga(vaga_id);

    if (!analises || analises.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Nenhuma análise encontrada para esta vaga",
        },
        { status: 404 },
      );
    }

    // Preparar dados para comparação
    const candidatos = analises
      .filter((a) => a.analisis_json)
      .map((a) => ({
        nome: a.email_candidato?.split("@")[0] || "Candidato",
        email: a.email_candidato || "N/A",
        sessao_id: a.sessao_id,
        analisis: a.analisis_json,
      }));

    if (candidatos.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Nenhuma análise válida encontrada",
        },
        { status: 404 },
      );
    }

    // Comparar
    const resultado = await compararCandidatos(candidatos);

    if (!resultado.sucesso) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.erro,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Comparação gerada com sucesso",
        total_candidatos: candidatos.length,
        dados: resultado.dados,
      },
      { status: 200 },
    );
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[POST /api/analise/comparar-candidatos]", err);

    return NextResponse.json(
      {
        sucesso: false,
        erro: mensagem,
      },
      { status: 500 },
    );
  }
}
