// app/api/candidatos/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buscarCandidaturaPorEmail } from "@/lib/queries/candidato-respostas";
import {
  isSupportedPhoneCountry,
  validatePhoneNumberForCountry,
} from "@/lib/validation";
import { resolveCompanyAndInterviewFromLegacyVaga } from "@/lib/queries/interviews";

export async function POST(request: NextRequest) {
  try {
    const { email, telefone, vaga_id, telefone_pais } = await request.json();

    // Validação básica
    if (!email || !telefone || !vaga_id) {
      return NextResponse.json(
        { error: "Email, telefone e vaga_id são obrigatórios" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCountry = String(telefone_pais || "PT").trim().toUpperCase();

    if (!isSupportedPhoneCountry(normalizedCountry)) {
      return NextResponse.json(
        { error: "País de telemóvel inválido" },
        { status: 400 },
      );
    }

    const phoneValidation = validatePhoneNumberForCountry(
      String(telefone),
      normalizedCountry,
    );

    if (!phoneValidation.isValid) {
      const errorMessage =
        phoneValidation.reason === "format"
          ? "Formato de telemóvel incorreto para o país selecionado"
          : "Número de telemóvel inválido";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const scope = await resolveCompanyAndInterviewFromLegacyVaga(vaga_id);
    if (!scope) {
      return NextResponse.json(
        { error: "Entrevista inválida para este identificador de vaga" },
        { status: 400 },
      );
    }

    // Verificar se já existe candidatura com estes dados
    const candidatura = await buscarCandidaturaPorEmail(
      normalizedEmail,
      scope.companyId,
      scope.interviewId,
    );

    if (candidatura) {
      return NextResponse.json({
        exists: true,
        message: "Estamos a analisar a sua candidatura.",
        candidacy: {
          id: candidatura.id,
          status: candidatura.status,
          criada_em: candidatura.criada_em,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Erro ao verificar candidatura:", error);
    return NextResponse.json(
      { error: "Erro ao verificar candidatura" },
      { status: 500 },
    );
  }
}
