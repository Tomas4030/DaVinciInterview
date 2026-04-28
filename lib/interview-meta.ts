export type InterviewWorkMode = "remote" | "hybrid" | "onsite" | "unspecified";
export type InterviewEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "unspecified";

const WORK_MODE_MARKER_REGEX = /\[\[work_mode:(remote|hybrid|onsite)\]\]/i;
const INTERVIEW_CONTEXT_MARKER_REGEX = /\[\[interview_context:([\s\S]*?)\]\]/i;
const EMPLOYMENT_TYPE_MARKER_REGEX =
  /\[\[employment_type:(full_time|part_time|contract|internship)\]\]/i;

export function normalizeInterviewWorkMode(value: unknown): InterviewWorkMode {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "remote") return "remote";
  if (normalized === "hybrid") return "hybrid";
  if (normalized === "onsite") return "onsite";
  return "unspecified";
}

export function normalizeInterviewEmploymentType(
  value: unknown,
): InterviewEmploymentType {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "full_time") return "full_time";
  if (normalized === "part_time") return "part_time";
  if (normalized === "contract") return "contract";
  if (normalized === "internship") return "internship";
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
  return source
    .replace(WORK_MODE_MARKER_REGEX, "")
    .replace(EMPLOYMENT_TYPE_MARKER_REGEX, "")
    .replace(INTERVIEW_CONTEXT_MARKER_REGEX, "")
    .trim();
}

export function extractInterviewContextFromDescription(
  description: string | null | undefined,
): string {
  const source = String(description || "");
  const match = source.match(INTERVIEW_CONTEXT_MARKER_REGEX);
  if (!match?.[1]) return "";
  return String(match[1]).trim();
}

export function extractInterviewEmploymentTypeFromDescription(
  description: string | null | undefined,
): InterviewEmploymentType {
  const source = String(description || "");
  const match = source.match(EMPLOYMENT_TYPE_MARKER_REGEX);
  if (!match?.[1]) return "unspecified";
  return normalizeInterviewEmploymentType(match[1]);
}

export function buildInterviewDescriptionWithMeta(
  baseDescription: string | null | undefined,
  workMode: InterviewWorkMode,
  employmentType: InterviewEmploymentType,
  interviewContext: string | null | undefined,
): string | null {
  const cleanBase = stripInterviewMetaFromDescription(baseDescription);
  const parts: string[] = [];

  if (cleanBase) {
    parts.push(cleanBase);
  }

  if (workMode !== "unspecified") {
    parts.push(`[[work_mode:${workMode}]]`);
  }

  if (employmentType !== "unspecified") {
    parts.push(`[[employment_type:${employmentType}]]`);
  }

  const cleanContext = String(interviewContext || "").trim();
  if (cleanContext) {
    parts.push(`[[interview_context:${cleanContext}]]`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
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
