import type { CandidateAnalysis } from "@/lib/ai-comparison-service";

export function getSourceBadgeClass(source: "ai" | "heuristic"): string {
  return source === "ai"
    ? "border-[#E1F3FE] bg-[#E1F3FE] text-[#1F6C9F]"
    : "border-[#FBF3DB] bg-[#FBF3DB] text-[#956400]";
}

export function getCandidateStatusBadgeClass(status: string): string {
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

export function getInitialLetter(value: string) {
  return (
    String(value || "")
      .trim()
      .charAt(0)
      .toUpperCase() || "C"
  );
}

export function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("pt-PT");
  } catch {
    return value;
  }
}

export function getBestSummaryText(candidate: CandidateAnalysis) {
  return (
    candidate.summary.executiveSummary ||
    "O candidato demonstra competências relevantes para a função, com base nas respostas recolhidas."
  );
}
