import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  deleteCompanyMember,
  getCompanyMemberById,
  getCompanyMembershipBySlug,
  listCompanyMembers,
  updateCompanyMemberRole,
  type CompanyRole,
} from "@/lib/queries/companies";

function normalizeMemberRole(value: unknown): Exclude<CompanyRole, "owner"> {
  return value === "admin" ? "admin" : "viewer";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; memberId: string } },
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

    const targetMember = await getCompanyMemberById(params.memberId, membership.company.id);
    if (!targetMember) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Não é possível editar o role do owner" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const role = normalizeMemberRole(body?.role);

    await updateCompanyMemberRole({
      memberId: targetMember.id,
      companyId: membership.company.id,
      role,
    });

    const members = await listCompanyMembers(membership.company.id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Erro ao atualizar membro da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar membro" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; memberId: string } },
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

    const targetMember = await getCompanyMemberById(params.memberId, membership.company.id);
    if (!targetMember) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Não é possível remover o owner" },
        { status: 400 },
      );
    }

    if (targetMember.user_id === session.userId) {
      return NextResponse.json(
        { error: "Não podes remover o teu próprio acesso" },
        { status: 400 },
      );
    }

    const deleted = await deleteCompanyMember(targetMember.id, membership.company.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Não foi possível remover o membro" },
        { status: 500 },
      );
    }

    const members = await listCompanyMembers(membership.company.id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Erro ao remover membro da empresa:", error);
    return NextResponse.json(
      { error: "Erro ao remover membro" },
      { status: 500 },
    );
  }
}
