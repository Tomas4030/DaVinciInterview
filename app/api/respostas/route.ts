// app/api/respostas/route.ts
// DEPRECATED: Use /api/candidato-respostas instead
// Este endpoint mantém-se por retrocompatibilidade, mas redireciona para o novo schema

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessao_id,
      vaga_id,
      pergunta_id,
      resposta_texto,
      texto_pergunta,
      duracao_segundos,
    } = body;

    if (!sessao_id || !vaga_id || !pergunta_id || !resposta_texto) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: sessao_id, vaga_id, pergunta_id, resposta_texto",
        },
        { status: 400 },
      );
    }

    // Obter candidatura existente pela sessao_id
    const { data: candidatura, error: fetchError } = await supabase()
      .from("candidato_respostas")
      .select("respostas")
      .eq("sessao_id", sessao_id)
      .single();

    if (fetchError || !candidatura) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 },
      );
    }

    // Adicionar resposta ao array
    const respostasAtuais = candidatura.respostas || [];
    const novaResposta = {
      pergunta_id,
      texto_pergunta,
      resposta_texto,
      duracao_segundos: duracao_segundos || 0,
      timestamp: new Date().toISOString(),
    };

    // Atualizar ou adicionar resposta
    const respostasUpdated = respostasAtuais.map((r: any) =>
      r.pergunta_id === pergunta_id ? novaResposta : r,
    );

    if (!respostasUpdated.some((r: any) => r.pergunta_id === pergunta_id)) {
      respostasUpdated.push(novaResposta);
    }

    // Guardar no Supabase
    const { data, error } = await supabase()
      .from("candidato_respostas")
      .update({ respostas: respostasUpdated })
      .eq("sessao_id", sessao_id)
      .select()
      .single();

    if (error) {
      console.error("[Supabase error]", error);
      return NextResponse.json(
        { error: "Falha ao guardar resposta" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/respostas]", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
