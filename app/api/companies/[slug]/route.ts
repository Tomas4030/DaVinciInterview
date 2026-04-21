import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import {
  getCompanyMembershipBySlug,
  updateCompanyProfile,
} from "@/lib/queries/companies";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export async function PUT(
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
    const name = String(body?.name || "").trim();
    const description = String(body?.description || "").trim() || null;
    const logoUrl = String(body?.logoUrl || "").trim() || null;
    const primaryColor = String(body?.primaryColor || "").trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 },
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Nome da empresa demasiado longo" },
        { status: 400 },
      );
    }

    if (primaryColor && !HEX_COLOR_REGEX.test(primaryColor)) {
      return NextResponse.json(
        { error: "Cor primária inválida. Usa formato #RRGGBB" },
        { status: 400 },
      );
    }

    const updatedCompany = await updateCompanyProfile(membership.company.id, {
      name,
      description,
      logoUrl,
      primaryColor,
    });

    if (!updatedCompany) {
      return NextResponse.json(
        { error: "Não foi possível atualizar empresa" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 },
    );
  }
}
