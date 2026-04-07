// app/api/vagas/[vagaId]/route.ts
// GET    /api/vagas/[vagaId] → obtém vaga por ID
// PUT    /api/vagas/[vagaId] → actualiza vaga (requer auth)
// DELETE /api/vagas/[vagaId] → apaga vaga (requer auth)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

interface Params {
  params: { vagaId: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vagas")
    .select("*")
    .eq("id", params.vagaId)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("vagas")
    .update(body)
    .eq("id", params.vagaId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("vagas")
    .delete()
    .eq("id", params.vagaId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
