// app/api/candidato-respostas/[sessaoId]/route.ts
// GET /api/candidato-respostas/[sessaoId] → obter candidatura (admin)
// POST /api/candidato-respostas/[sessaoId] → adicionar resposta

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

    // TODO: Validar autenticação de admin aqui
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("candidato_respostas")
      .select("*")
      .eq("sessao_id", sessaoId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Candidatura não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
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

    if (!resposta) {
      return NextResponse.json(
        { error: "Missing resposta field" },
        { status: 400 },
      );
    }

    // Obter candidatura
    const { data: candidatura, error: fetchError } = await supabase
      .from("candidato_respostas")
      .select("respostas")
      .eq("sessao_id", sessaoId)
      .single();

    if (fetchError || !candidatura) {
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
    const { data, error } = await supabase
      .from("candidato_respostas")
      .update({
        respostas: respostasUpdated,
        atualizada_em: new Date().toISOString(),
      })
      .eq("sessao_id", sessaoId)
      .select()
      .single();

    if (error) {
      console.error("[Supabase error]", error);
      return NextResponse.json(
        { error: "Failed to update resposta" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
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
