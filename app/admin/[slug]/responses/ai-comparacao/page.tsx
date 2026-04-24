import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import {
  buildAiComparisonsForCompany,
  type InterviewAnalysis,
} from "@/lib/ai-comparison-service";
import {
  AiComparisonHeader,
  CandidateSidebar,
  CandidateDetails,
} from "@/components/admin/ai-comparacao";

export const metadata: Metadata = { title: "Admin - Analise IA" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams?: {
    vaga?: string;
    sessao?: string;
  };
};

export default async function AdminCompanyAiComparisonPage({
  params,
  searchParams,
}: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) notFound();

  const membership = await getCompanyMembershipBySlug(
    session.userId,
    params.slug,
  );
  if (!membership) notFound();

  const vagas = await buildAiComparisonsForCompany(membership.company.id);

  const selectedVaga =
    vagas.find((vaga) => vaga.vagaId === searchParams?.vaga) ||
    vagas[0] ||
    null;

  const selectedInterview =
    (searchParams?.sessao
      ? selectedVaga?.interviews.find((interview) =>
          interview.candidates.some(
            (candidate) => candidate.sessaoId === searchParams.sessao,
          ),
        )
      : null) ||
    selectedVaga?.interviews[0] ||
    null;

  const selectedRanking: InterviewAnalysis["ranking"] =
    selectedInterview?.ranking && selectedInterview.ranking.length > 0
      ? selectedInterview.ranking
      : [];

  const selectedSessionId =
    searchParams?.sessao ||
    selectedRanking[0]?.sessaoId ||
    selectedInterview?.candidates[0]?.sessaoId ||
    null;

  const selectedCandidate =
    selectedInterview?.candidates.find(
      (candidate) => candidate.sessaoId === selectedSessionId,
    ) ||
    selectedInterview?.candidates[0] ||
    null;

  const selectedCandidateRankingIndex = selectedRanking.findIndex(
    (item) => item.sessaoId === selectedCandidate?.sessaoId,
  );

  const selectedCandidateRanking =
    selectedCandidateRankingIndex >= 0 ? selectedCandidateRankingIndex + 1 : 1;

  const selectedCandidateRankingItem =
    selectedRanking.find(
      (item) => item.sessaoId === selectedCandidate?.sessaoId,
    ) || null;

  return (
    <section className="space-y-5">
      <AiComparisonHeader
        slug={params.slug}
        vagas={vagas}
        selectedVagaId={selectedVaga?.vagaId}
      />

      {!selectedVaga || !selectedInterview || !selectedCandidate ? (
        <div className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-8 text-sm text-[var(--c-muted)]">
          Ainda não existem candidatos suficientes para análise.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px,1fr]">
          <CandidateSidebar
            slug={params.slug}
            selectedVaga={selectedVaga}
            selectedInterview={selectedInterview}
            selectedCandidate={selectedCandidate}
          />

          <CandidateDetails
            slug={params.slug}
            selectedVaga={selectedVaga}
            selectedInterview={selectedInterview}
            selectedCandidate={selectedCandidate}
            selectedCandidateRanking={selectedCandidateRanking}
            selectedCandidateRankingItem={selectedCandidateRankingItem}
          />
        </div>
      )}
    </section>
  );
}
