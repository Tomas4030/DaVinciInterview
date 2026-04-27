import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  addCompanyMember,
  getCompanyMemberByUserId,
  getCompanyMembershipBySlug,
  listCompanyMembers,
  type CompanyRole,
} from "@/lib/queries/companies";
import { ensureUserByEmail } from "@/lib/queries/users";

function normalizeMemberRole(value: unknown): Exclude<CompanyRole, "owner"> {
  return value === "admin" ? "admin" : "viewer";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
    if (!membership) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
    }

    const members = await listCompanyMembers(membership.company.id);

    return NextResponse.json({
      members,
      currentUserId: session.userId,
      currentUserRole: membership.role,
    });
  } catch (error) {
    console.error("Erro ao listar membros da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao listar membros" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
    if (!membership) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissões" }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const role = normalizeMemberRole(body?.role);

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const user = await ensureUserByEmail(email);
    const existing = await getCompanyMemberByUserId(user.id, membership.company.id);
    if (existing) {
      return NextResponse.json(
        { error: "Este utilizador já pertence à empresa" },
        { status: 409 },
      );
    }

    await addCompanyMember({
      companyId: membership.company.id,
      userId: user.id,
      role,
    });

    const members = await listCompanyMembers(membership.company.id);
    return NextResponse.json({ members }, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar membro da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar membro" },
      { status: 500 },
    );
  }
}
