import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminSessionFromRequest } from "@/lib/super-admin-context";
import {
  createSuperAdmin,
  listSuperAdmins,
  updateSuperAdminActiveState,
} from "@/lib/queries/super-admins";

export async function GET(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await listSuperAdmins();
  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { error: "name, email e password (>=8) são obrigatórios" },
        { status: 400 },
      );
    }

    const created = await createSuperAdmin({
      name,
      email,
      password,
      createdBySuperAdminId: session.superAdminId,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: created.id,
        email: created.email,
        name: created.name,
        is_active: created.is_active,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSuperAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id || "").trim();
    const isActive = Boolean(body?.isActive);

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    await updateSuperAdminActiveState(id, isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
