import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  addCompanyMember,
  getCompanyById,
  getCompanyMemberByUserId,
} from "@/lib/queries/companies";
import { getUserById } from "@/lib/queries/users";
import { getInviteByToken, markInviteAccepted } from "@/lib/queries/company-invites";

export async function POST(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(tokenCookie);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const token = String(body?.token || "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 });
    }

    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Convite já utilizado" }, { status: 409 });
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Convite expirado" }, { status: 410 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Utilizador inválido" }, { status: 404 });
    }
    if (String(user.email || "").trim().toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Este convite pertence a outro email" },
        { status: 403 },
      );
    }

    const existing = await getCompanyMemberByUserId(user.id, invite.company_id);
    if (!existing) {
      await addCompanyMember({
        companyId: invite.company_id,
        userId: user.id,
        role: invite.role,
      });
    }

    await markInviteAccepted(invite.token);

    const company = await getCompanyById(invite.company_id);
    return NextResponse.json({
      success: true,
      redirectTo: company ? `/admin/${company.slug}/dashboard` : "/onboarding",
    });
  } catch (error: any) {
    console.error("Erro ao aceitar convite:", error);
    if (String(error?.code || "") === "ER_NO_SUCH_TABLE") {
      return NextResponse.json(
        { error: "Tabela de convites não existe. Executa a migração de convites." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erro ao aceitar convite" }, { status: 500 });
  }
}
