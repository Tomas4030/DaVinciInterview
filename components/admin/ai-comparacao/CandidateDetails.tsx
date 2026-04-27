import Link from "next/link";
import { tAdmin } from "@/lib/i18n/admin";
import type {
  CandidateAnalysis,
  InterviewAnalysis,
  VagaAnalysis,
} from "@/lib/ai-comparison-service";
import {
  formatDate,
  getBestSummaryText,
  getCandidateStatusBadgeClass,
  getInitialLetter,
} from "./helpers";

type Props = {
  slug: string;
  selectedVaga: VagaAnalysis;
  selectedInterview: InterviewAnalysis;
  selectedCandidate: CandidateAnalysis;
  selectedCandidateRanking: number;
  selectedCandidateRankingItem:
    | {
        sessaoId: string;
        email: string;
        score: number;
        reason: string;
      }
    | null;
  locale?: string;
};

export default function CandidateDetails({
  slug,
  selectedVaga,
  selectedInterview,
  selectedCandidate,
  selectedCandidateRanking,
  selectedCandidateRankingItem,
  locale = "en",
}: Props) {
  return (
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
                {selectedCandidateRankingItem?.score ?? selectedCandidate.score}
              </p>
              <p className="mt-3 text-sm text-[#4F46E5]">
                {tAdmin(locale, "aiComparison.excellent")}
              </p>
            </div>

            <div className="rounded-[18px] border border-[var(--c-border)]/70 bg-white px-6 py-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
                {tAdmin(locale, "aiComparison.ranking")}
              </p>
              <p className="mt-3 text-[60px] font-semibold leading-none text-[#4F46E5]">
                #{selectedCandidateRanking}
              </p>
              <p className="mt-3 text-sm text-[var(--c-muted)]">
                {tAdmin(
                  locale,
                  selectedInterview.candidates.length === 1
                    ? "aiComparison.outOfSingular"
                    : "aiComparison.outOfPlural",
                  { count: selectedInterview.candidates.length },
                )}
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
            {tAdmin(locale, "aiComparison.summaryTitle")}
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
                {tAdmin(locale, "aiComparison.strengthsTitle")}
              </h3>
            </div>
          </div>

          <div className="px-5 py-5">
            <ul className="space-y-4">
              {(selectedCandidate.summary.strengths.length > 0
                ? selectedCandidate.summary.strengths
                : [tAdmin(locale, "aiComparison.strengthsEmpty")]
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
                {tAdmin(locale, "aiComparison.concernsTitle")}
              </h3>
            </div>
          </div>

          <div className="px-5 py-5">
            <ul className="space-y-4">
              {(selectedCandidate.summary.concerns.length > 0
                ? selectedCandidate.summary.concerns
                : [tAdmin(locale, "aiComparison.concernsEmpty")]
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
            {tAdmin(locale, "aiComparison.detailsTitle")}
          </h3>
        </div>

        <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[12px] font-medium text-[var(--c-muted)]">
                {tAdmin(locale, "aiComparison.roleLabel")}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                {selectedVaga.vagaTitle}
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium text-[var(--c-muted)]">
                {tAdmin(locale, "aiComparison.interviewDate")}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                {formatDate(selectedCandidate.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium text-[var(--c-muted)]">
                {tAdmin(locale, "aiComparison.answers")}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[var(--c-text)]">
                {selectedCandidate.answerCount}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/admin/${slug}/responses/${selectedCandidate.sessaoId}`}
            className="inline-flex h-[46px] items-center justify-center rounded-xl border border-[#D9DDF4] bg-white px-5 text-sm font-medium text-[#4F46E5] transition hover:bg-[#F8F9FF]"
          >
            {tAdmin(locale, "aiComparison.viewAnswers")}
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
          {tAdmin(locale, "aiComparison.analysisGeneratedAt", {
            source:
              selectedInterview.source === "ai"
                ? tAdmin(locale, "aiComparison.analysisAi")
                : tAdmin(locale, "aiComparison.analysisHeuristic"),
            date: formatDate(selectedInterview.generatedAt),
          })}
        </p>
      </div>
    </section>
  );
}
