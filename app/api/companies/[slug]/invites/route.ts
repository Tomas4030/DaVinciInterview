import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import {
  createCompanyInvite,
  listPendingInvitesByCompany,
  revokeInviteById,
} from "@/lib/queries/company-invites";

function normalizeRole(value: unknown): "admin" | "viewer" {
  return value === "admin" ? "admin" : "viewer";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  if (membership.role !== "owner" && membership.role !== "admin") {
    return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
  }

  const invites = await listPendingInvitesByCompany(membership.company.id);
  return NextResponse.json({ invites });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
    if (!membership) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const role = normalizeRole(body?.role);
    if (!email) return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });

    const invite = await createCompanyInvite({
      companyId: membership.company.id,
      email,
      role,
      invitedByUserId: session.userId,
    });

    const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").trim() || request.nextUrl.origin;
    const inviteUrl = `${appUrl}/invite/${invite.token}`;

    const invites = await listPendingInvitesByCompany(membership.company.id);
    return NextResponse.json({ invite, inviteUrl, invites }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar convite:", error);
    if (String(error?.code || "") === "ER_NO_SUCH_TABLE") {
      return NextResponse.json(
        { error: "Tabela de convites não existe. Executa a migração de convites." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erro ao criar convite" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  if (membership.role !== "owner" && membership.role !== "admin") {
    return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
  }

  const body = await request.json();
  const inviteId = String(body?.inviteId || "").trim();
  if (!inviteId) return NextResponse.json({ error: "inviteId é obrigatório" }, { status: 400 });

  await revokeInviteById(inviteId, membership.company.id);
  const invites = await listPendingInvitesByCompany(membership.company.id);
  return NextResponse.json({ invites });
}
