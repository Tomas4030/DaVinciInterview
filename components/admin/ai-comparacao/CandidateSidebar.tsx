import Link from "next/link";
import { tAdmin } from "@/lib/i18n/admin";
import type {
  CandidateAnalysis,
  InterviewAnalysis,
  VagaAnalysis,
} from "@/lib/ai-comparison-service";
import {
  getCandidateStatusBadgeClass,
  getInitialLetter,
} from "./helpers";

type Props = {
  slug: string;
  selectedVaga: VagaAnalysis;
  selectedInterview: InterviewAnalysis;
  selectedCandidate: CandidateAnalysis;
  locale?: string;
};

export default function CandidateSidebar({
  slug,
  selectedVaga,
  selectedInterview,
  selectedCandidate,
  locale = "en",
}: Props) {
  const selectedRanking =
    selectedInterview.ranking && selectedInterview.ranking.length > 0
      ? selectedInterview.ranking
      : [];

  return (
    <aside className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-semibold text-[var(--c-text)]">
            {tAdmin(locale, "aiComparison.sidebarTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--c-muted)]">
            {tAdmin(locale, "aiComparison.sidebarTotal")}
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
            placeholder={tAdmin(locale, "aiComparison.searchPlaceholder")}
            className="h-[46px] w-full rounded-xl border border-[var(--c-border)]/70 bg-white pl-10 pr-4 text-sm text-[var(--c-muted)] outline-none"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {selectedRanking.map((rankedItem, index) => {
          const candidate = selectedInterview.candidates.find(
            (item) => item.sessaoId === rankedItem.sessaoId,
          );
          if (!candidate) return null;

          const isActive = candidate.sessaoId === selectedCandidate.sessaoId;

          return (
            <Link
              key={candidate.sessaoId}
              href={`/${locale}/admin/${slug}/responses/ai-comparacao?vaga=${selectedVaga.vagaId}&sessao=${candidate.sessaoId}`}
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
                      {tAdmin(locale, "aiComparison.score")}: {" "}
                      <span className="font-semibold">{rankedItem.score}</span>
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
  );
}
