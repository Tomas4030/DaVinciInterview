import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import {
  buildAiComparisonsForCompany,
  type CandidateAnalysis,
} from "@/lib/ai-comparison-service";
import AiComparisonRefreshButton from "@/components/admin/AiComparisonRefreshButton";
import VagaSelector from "@/components/admin/company-dashboard/VagaSelector";

export const metadata: Metadata = { title: "Admin - Analise IA" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams?: {
    vaga?: string;
    sessao?: string;
  };
};

function getSourceBadgeClass(source: "ai" | "heuristic"): string {
  return source === "ai"
    ? "border-[#E1F3FE] bg-[#E1F3FE] text-[#1F6C9F]"
    : "border-[#FBF3DB] bg-[#FBF3DB] text-[#956400]";
}

function getCandidateStatusBadgeClass(status: string): string {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "concluida") {
    return "border-[#EDF3EC] bg-[#EDF3EC] text-[#346538]";
  }
  if (normalized === "em_analise") {
    return "border-[#E1F3FE] bg-[#E1F3FE] text-[#1F6C9F]";
  }
  if (normalized === "rejeitada") {
    return "border-[#FDEBEC] bg-[#FDEBEC] text-[#9F2F2D]";
  }
  return "border-[#FBF3DB] bg-[#FBF3DB] text-[#956400]";
}

function getInitialLetter(value: string) {
  return (
    String(value || "")
      .trim()
      .charAt(0)
      .toUpperCase() || "C"
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("pt-PT");
  } catch {
    return value;
  }
}

function getBestSummaryText(candidate: CandidateAnalysis) {
  return (
    candidate.summary.executiveSummary ||
    "O candidato demonstra competências relevantes para a função, com base nas respostas recolhidas."
  );
}

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

  const totalInterviews = vagas.reduce(
    (acc, vaga) => acc + vaga.interviews.length,
    0,
  );

  const totalCandidates = vagas.reduce(
    (acc, vaga) =>
      acc +
      vaga.interviews.reduce(
        (sum, interview) => sum + interview.candidates.length,
        0,
      ),
    0,
  );

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

  const selectedRanking =
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
      <header className="overflow-hidden rounded-2xl border border-[var(--c-border)]/60 bg-[var(--c-surface)] shadow-sm">
        {/* Top bar — título */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5]/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="1.8"
              className="h-4.5 w-4.5"
            >
              <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[var(--c-muted)]">
              Análise IA
            </p>
            <h1 className="text-lg font-semibold leading-tight text-[var(--c-text)]">
              Comparação de candidatos por vaga
            </h1>
          </div>
        </div>

        {/* Bottom bar — selector + actions */}
        <div className="border-t border-[var(--c-border)]/50 bg-[var(--c-bg)]/60 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">
                Vaga
              </p>
              <VagaSelector
                vagas={vagas}
                selectedVagaId={selectedVaga?.vagaId}
                slug={params.slug}
              />
            </div>

            <div className="flex items-center gap-2">
              <AiComparisonRefreshButton slug={params.slug} />

              <Link
                href={`/admin/${params.slug}/responses`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#4F46E5] px-3 text-xs font-medium text-white shadow-sm transition hover:bg-[#4338CA] active:scale-[0.98]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-3 w-3"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                Voltar às respostas
              </Link>
            </div>
          </div>
        </div>
      </header>

      {!selectedVaga || !selectedInterview || !selectedCandidate ? (
        <div className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-8 text-sm text-[var(--c-muted)]">
          Ainda não existem candidatos suficientes para análise.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px,1fr]">
          <aside className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-semibold text-[var(--c-text)]">
                  Candidatos
                </h2>
                <p className="mt-1 text-sm text-[var(--c-muted)]">
                  Total de candidatos
                </p>
              </div>

              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#F1F3F9] px-2 text-xs font-semibold text-[var(--c-muted)]">
                {selectedInterview.candidates.length}
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--c-muted)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </div>
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder="Pesquisar candidato..."
                  className="h-[46px] w-full rounded-xl border border-[var(--c-border)]/70 bg-white pl-10 pr-4 text-sm text-[var(--c-muted)] outline-none"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-[var(--c-border)]/70 bg-white text-[var(--c-muted)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path d="M4 6h16" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {selectedRanking.map((rankedItem, index) => {
                const candidate = selectedInterview.candidates.find(
                  (item) => item.sessaoId === rankedItem.sessaoId,
                );
                if (!candidate) return null;

                const isActive =
                  candidate.sessaoId === selectedCandidate.sessaoId;

                return (
                  <Link
                    key={candidate.sessaoId}
                    href={`/admin/${params.slug}/responses/ai-comparacao?vaga=${selectedVaga.vagaId}&sessao=${candidate.sessaoId}`}
                    className={[
                      "block rounded-[18px] border px-4 py-4 transition",
                      isActive
                        ? "border-[#8B8FFF] bg-[#FCFCFF] shadow-sm"
                        : "border-[var(--c-border)]/70 bg-white hover:border-[#D8DBF8]",
                    ].join(" ")}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE7FF] text-sm font-semibold text-[#7C58D6]">
                        {getInitialLetter(candidate.email)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--c-text)]">
                          {candidate.email}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] ${getCandidateStatusBadgeClass(candidate.status)}`}
                          >
                            {candidate.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-sm text-[var(--c-text)]">
                            Score:{" "}
                            <span className="font-semibold">
                              {rankedItem.score}
                            </span>
                          </p>

                          <p className="text-sm font-semibold text-[var(--c-text)]">
                            #{index + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EFE7FF] text-[28px] font-semibold text-[#7C58D6]">
                    {getInitialLetter(selectedCandidate.email)}
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-all text-[20px] font-semibold text-[var(--c-text)]">
                      {selectedCandidate.email}
                    </h2>
                    <p className="mt-1 text-base text-[var(--c-muted)]">
                      {selectedVaga.vagaTitle}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] ${getCandidateStatusBadgeClass(selectedCandidate.status)}`}
                      >
                        {selectedCandidate.status}
                      </span>

                      <span className="text-sm text-[var(--c-muted)]">
                        {formatDate(selectedCandidate.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[290px]">
                  <div className="rounded-[18px] border border-[var(--c-border)]/70 bg-white px-6 py-5 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
                      Score
                    </p>
                    <p className="mt-3 text-[60px] font-semibold leading-none text-[#4F46E5]">
                      {selectedCandidateRankingItem?.score ??
                        selectedCandidate.score}
                    </p>
                    <p className="mt-3 text-sm text-[#4F46E5]">Excelente</p>
                  </div>

                  <div className="rounded-[18px] border border-[var(--c-border)]/70 bg-white px-6 py-5 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
                      Ranking
                    </p>
                    <p className="mt-3 text-[60px] font-semibold leading-none text-[#4F46E5]">
                      #{selectedCandidateRanking}
                    </p>
                    <p className="mt-3 text-sm text-[var(--c-muted)]">
                      de {selectedInterview.candidates.length} candidato
                      {selectedInterview.candidates.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <path d="M12 3l1.8 4.9L19 10l-5.2 2.1L12 17l-1.8-4.9L5 10l5.2-2.1L12 3Z" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-[var(--c-text)]">
                  Resumo da análise
                </h3>
              </div>

              <p className="mt-4 text-[15px] leading-8 text-[var(--c-muted)]">
                {getBestSummaryText(selectedCandidate)}
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="overflow-hidden rounded-[20px] border border-[#BFE0C5] bg-white">
                <div className="border-b border-[#BFE0C5] bg-[#F4FBF5] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BFE0C5] text-[#2E9A44]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#2C5C35]">
                      Pontos fortes
                    </h3>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <ul className="space-y-4">
                    {(selectedCandidate.summary.strengths.length > 0
                      ? selectedCandidate.summary.strengths
                      : ["Sem pontos fortes identificados automaticamente."]
                    ).map((item, index) => (
                      <li
                        key={`strength-${index}`}
                        className="flex gap-3 text-sm leading-7 text-[var(--c-muted)]"
                      >
                        <span className="mt-[10px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#2E9A44]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-[#F1D39C] bg-white">
                <div className="border-b border-[#F1D39C] bg-[#FFF9ED] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F1D39C] text-[#D08A00]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.3 3.8L2.9 16.2A2 2 0 0 0 4.6 19h14.8a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                      </svg>
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#8C5A00]">
                      Pontos de atenção
                    </h3>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <ul className="space-y-4">
                    {(selectedCandidate.summary.concerns.length > 0
                      ? selectedCandidate.summary.concerns
                      : ["Sem pontos de atenção identificados automaticamente."]
                    ).map((item, index) => (
                      <li
                        key={`concern-${index}`}
                        className="flex gap-3 text-sm leading-7 text-[var(--c-muted)]"
                      >
                        <span className="mt-[10px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#E7A928]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                  >
                    <rect x="6" y="4" width="12" height="16" rx="2" />
                    <path d="M9 9h6" />
                    <path d="M9 13h6" />
                  </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-[var(--c-text)]">
                  Detalhes da entrevista
                </h3>
              </div>

              <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid flex-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[12px] font-medium text-[var(--c-muted)]">
                      Vaga
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                      {selectedVaga.vagaTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-[12px] font-medium text-[var(--c-muted)]">
                      Entrevista realizada em
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                      {formatDate(selectedCandidate.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[12px] font-medium text-[var(--c-muted)]">
                      Respostas
                    </p>
                    <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                      {selectedCandidate.answerCount}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/${params.slug}/responses/${selectedCandidate.sessaoId}`}
                  className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#D9DDF4] bg-white px-5 text-sm font-medium text-[#4F46E5] transition hover:bg-[#F8F9FF]"
                >
                  Ver respostas ↗
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1 text-sm text-[var(--c-muted)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v5" />
                <path d="M12 7h.01" />
              </svg>
              <p>
                Análise{" "}
                {selectedInterview.source === "ai"
                  ? "gerada por IA"
                  : "calculada por heurística"}{" "}
                em {formatDate(selectedInterview.generatedAt)}.
              </p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
