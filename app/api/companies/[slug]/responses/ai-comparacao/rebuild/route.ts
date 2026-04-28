import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { buildAiComparisonsForCompany } from "@/lib/ai-comparison-service";

type Props = {
  params: { slug: string };
};

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = parseAdminToken(token);

    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
    if (!membership) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (membership.role === "viewer") {
      return NextResponse.json(
        { error: "Sem permissao para recriar analises" },
        { status: 403 },
      );
    }

    if (membership.company.plan !== "pro" && membership.company.plan !== "enterprise") {
      return NextResponse.json(
        { error: "Comparacao IA disponivel apenas no plano Pro." },
        { status: 403 },
      );
    }

    const vagas = await buildAiComparisonsForCompany(membership.company.id, {
      forceRegenerate: true,
    });

    const interviews = vagas.reduce((acc, vaga) => acc + vaga.interviews.length, 0);

    return NextResponse.json({
      success: true,
      vagas: vagas.length,
      interviews,
    });
  } catch (error) {
    console.error("[POST /api/companies/[slug]/responses/ai-comparacao/rebuild]", error);
    return NextResponse.json(
      { error: "Erro ao recriar analises" },
      { status: 500 },
    );
  }
}
