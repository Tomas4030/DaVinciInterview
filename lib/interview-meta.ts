export type InterviewWorkMode = "remote" | "hybrid" | "onsite" | "unspecified";

const WORK_MODE_MARKER_REGEX = /\[\[work_mode:(remote|hybrid|onsite)\]\]/i;

export function normalizeInterviewWorkMode(value: unknown): InterviewWorkMode {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "remote") return "remote";
  if (normalized === "hybrid") return "hybrid";
  if (normalized === "onsite") return "onsite";
  return "unspecified";
}

export function mapLegacyModalidadeToWorkMode(
  modalidade: string | null | undefined,
): InterviewWorkMode {
  const normalized = String(modalidade || "")
    .trim()
    .toLowerCase();

  if (normalized === "remoto") return "remote";
  if (normalized === "híbrido" || normalized === "hibrido") return "hybrid";
  if (normalized === "presencial") return "onsite";
  return "unspecified";
}

export function extractInterviewWorkModeFromDescription(
  description: string | null | undefined,
): InterviewWorkMode {
  const source = String(description || "");
  const match = source.match(WORK_MODE_MARKER_REGEX);
  if (!match?.[1]) return "unspecified";
  return normalizeInterviewWorkMode(match[1]);
}

export function stripInterviewMetaFromDescription(
  description: string | null | undefined,
): string {
  const source = String(description || "");
  return source.replace(WORK_MODE_MARKER_REGEX, "").trim();
}

export function getInterviewWorkModeLabel(workMode: InterviewWorkMode): string {
  if (workMode === "remote") return "Remoto";
  if (workMode === "hybrid") return "Hibrido";
  if (workMode === "onsite") return "Presencial";
  return "Entrevista";
}

export function getInterviewWorkModeBadgeClass(workMode: InterviewWorkMode): string {
  if (workMode === "remote") {
    return "bg-[var(--c-brand)]/10 text-[var(--c-brand)] ring-1 ring-[var(--c-brand)]/15";
  }
  if (workMode === "hybrid") {
    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }
  if (workMode === "onsite") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
  return "bg-[var(--c-brand)]/10 text-[var(--c-brand)] ring-1 ring-[var(--c-brand)]/15";
}

export function getInterviewQuestionCount(questions: any[]): number {
  if (!Array.isArray(questions)) return 0;

  return questions.filter((item) => {
    if (typeof item === "string") return item.trim().length > 0;
    if (typeof item?.question === "string") return item.question.trim().length > 0;
    if (typeof item?.texto === "string") return item.texto.trim().length > 0;
    return false;
  }).length;
}

export function estimateInterviewDurationMinutes(questions: any[]): number {
  return getInterviewQuestionCount(questions);
}
