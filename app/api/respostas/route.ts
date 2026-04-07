// app/api/respostas/route.ts
// POST /api/respostas → guarda uma resposta (público, sem auth)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const body = await req.json();
  const { vaga_id, pergunta_id, resposta, sessao_id } = body;

  if (!vaga_id || !pergunta_id || !resposta) {
    return NextResponse.json(
      { error: "Campos obrigatórios em falta" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("respostas")
    .insert({ vaga_id, pergunta_id, resposta, sessao_id })
    .select("id, sessao_id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
