// app/api/vagas/route.ts
// GET  /api/vagas    → lista vagas ativas
// POST /api/vagas    → cria nova vaga (requer auth)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from("vagas")
    .select("*")
    .eq("ativa", true)
    .order("criada_em", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const vagas = (data ?? []).map((v: any) => ({
    ...v,
    total_perguntas: Array.isArray(v.perguntas) ? v.perguntas.length : 0,
  }));

  return NextResponse.json(vagas);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await (supabase as any).auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await (supabase as any)
    .from("vagas")
    .insert(body)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
