import Link from "next/link";
import {
  ArrowUpRight,
  IconBuilding,
  IconGlobe,
  IconLayers,
} from "@/components/ui/Icons";
import {
  estimateInterviewDurationMinutes,
  extractInterviewWorkModeFromDescription,
  getInterviewQuestionCount,
  getInterviewWorkModeLabel,
  mapLegacyModalidadeToWorkMode,
  stripInterviewMetaFromDescription,
} from "@/lib/interview-meta";
import type { InterviewRecord } from "@/lib/queries/interviews";

type CompanyInterviewsSectionProps = {
  companySlug: string;
  interviews: InterviewRecord[];
};

function getInterviewsLabel(count: number) {
  if (count === 0) return "Sem posições disponíveis de momento";
  return `${count} posiç${count === 1 ? "ão" : "ões"} disponívei${count === 1 ? "l" : "s"}`;
}

const INTERVIEW_WORK_MODE_CONFIG = {
  remote: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50",
    dot: "bg-sky-500",
    Icon: IconGlobe,
  },
  hybrid: {
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/50",
    dot: "bg-violet-500",
    Icon: IconLayers,
  },
  onsite: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
    dot: "bg-emerald-500",
    Icon: IconBuilding,
  },
} as const;

const INTERVIEW_WORK_MODE_FALLBACK = {
  label: "Entrevista",
  badge: "bg-gray-50 text-gray-600 ring-1 ring-gray-200/50",
  dot: "bg-gray-400",
  Icon: IconGlobe,
};

export default function CompanyInterviewsSection({
  companySlug,
  interviews,
}: CompanyInterviewsSectionProps) {
  const interviewsCount = interviews.length;

  return (
    <section id="vagas" className="relative mx-auto max-w-6xl px-6 pb-16 pt-14">
      <div className="mb-10 flex items-end gap-6">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-tight text-[var(--c-text)]">
            Vagas abertas
          </h2>
          <p className="mt-1 text-[0.82rem] text-[var(--c-text)]/55">
            {getInterviewsLabel(interviewsCount)}
          </p>
        </div>
      </div>

      {interviewsCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] px-8 py-24 text-center">
          <p className="font-medium text-[var(--c-text)]">
            Nenhuma vaga disponível de momento.
          </p>
          <p className="mt-1.5 text-sm text-[var(--c-text)]/60">
            Volta em breve ou contacta o recrutador.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview, index) => {
            const metaWorkMode = extractInterviewWorkModeFromDescription(
              interview.description,
            );
            const normalizedSavedWorkMode =
              interview.work_mode && interview.work_mode !== "unspecified"
                ? interview.work_mode
                : "unspecified";
            const legacyWorkMode = mapLegacyModalidadeToWorkMode(
              interview.legacy_modalidade,
            );
            const workMode =
              normalizedSavedWorkMode !== "unspecified"
                ? normalizedSavedWorkMode
                : legacyWorkMode !== "unspecified"
                  ? legacyWorkMode
                  : metaWorkMode;

            const modeConfig =
              INTERVIEW_WORK_MODE_CONFIG[
                workMode as keyof typeof INTERVIEW_WORK_MODE_CONFIG
              ] ?? INTERVIEW_WORK_MODE_FALLBACK;

            const workModeLabel =
              workMode === "unspecified"
                ? INTERVIEW_WORK_MODE_FALLBACK.label
                : getInterviewWorkModeLabel(workMode);
            const { badge, dot, Icon } = modeConfig;

            const totalQuestions = getInterviewQuestionCount(
              interview.questions,
            );
            const estimatedDuration = estimateInterviewDurationMinutes(
              interview.questions,
            );
            const cleanDescription = stripInterviewMetaFromDescription(
              interview.description,
            );

            return (
              <article
                key={interview.id}
                className="group relative flex flex-col rounded-[14px] border border-[var(--c-border)]/80 bg-[var(--c-surface)] p-5
                           transition-[transform,box-shadow,border-color] duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                           hover:-translate-y-[3px] hover:border-[var(--c-brand)]/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]
                           animate-reveal"
                style={{ animationDelay: `${100 + index * 80}ms` }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[14px] bg-gradient-to-r from-[var(--c-brand)]/60 via-[var(--c-brand)]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-4 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <Icon />
                    {workModeLabel}
                  </span>

                  <span className="text-[11px] tabular-nums text-[var(--c-text)]/50">
                    {estimatedDuration} min
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-[1.05rem] font-semibold leading-[1.35] tracking-[-0.015em] text-[var(--c-text)] transition-colors duration-200 group-hover:text-[var(--c-brand)]">
                    {interview.title}
                  </h3>

                  {cleanDescription ? (
                    <p className="line-clamp-2 text-[0.815rem] leading-relaxed text-[var(--c-text)]/60">
                      {cleanDescription}
                    </p>
                  ) : (
                    <p className="text-[0.815rem] italic leading-relaxed text-[var(--c-text)]/40">
                      Sem descrição disponível.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--c-border)]/60 pt-3.5">
                  <span className="text-[11px] text-[var(--c-text)]/50">
                    {totalQuestions}{" "}
                    {totalQuestions === 1 ? "pergunta" : "perguntas"}
                  </span>

                  <Link
                    href={`/${companySlug}/interview/${interview.id}`}
                    aria-label={`Iniciar entrevista: ${interview.title}`}
                    className="group/link inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--c-text)]/50 transition-colors duration-200 hover:text-[var(--c-brand)]"
                  >
                    Iniciar
                    <span className="transition-transform duration-200 group-hover/link:translate-x-[2px] group-hover/link:-translate-y-[2px]">
                      <ArrowUpRight />
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
