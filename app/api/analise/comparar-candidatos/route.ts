// app/api/analise/comparar-candidatos/route.ts
/**
 * POST /api/analise/comparar-candidatos
 *
 * Compara vários candidatos numa mesma vaga
 * Retorna ranking, destaques e análise comparativa
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compararCandidatos } from "@/lib/analysis-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
    const { data: analises, error: fetchError } = await supabase
      .from("analises_entrevista")
      .select("*")
      .eq("vaga_id", vaga_id)
      .not("email_candidato", "is", null);

    if (fetchError) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Erro ao obter análises: ${fetchError.message}`,
        },
        { status: 500 },
      );
    }

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
