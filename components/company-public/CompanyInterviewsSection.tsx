import Link from "next/link";
import {
  ArrowUpRight,
  IconBuilding,
  IconGlobe,
  IconLayers,
} from "@/components/ui/Icons";
import {
  estimateInterviewDurationMinutes,
  extractInterviewCardEmojiFromDescription,
  extractInterviewCardThemeFromDescription,
  extractInterviewContextFromDescription,
  extractInterviewEmploymentTypeFromDescription,
  extractInterviewExperienceLevelFromDescription,
  extractInterviewWorkModeFromDescription,
  getInterviewQuestionCount,
  mapLegacyModalidadeToWorkMode,
  normalizeInterviewCardTheme,
  normalizeInterviewExperienceLevel,
  normalizeInterviewEmploymentType,
  stripInterviewMetaFromDescription,
} from "@/lib/interview-meta";
import { tInterview } from "@/lib/i18n/interview";
import type { InterviewRecord } from "@/lib/queries/interviews";

type CompanyInterviewsSectionProps = {
  locale?: string;
  companySlug: string;
  interviews: InterviewRecord[];
};

function getInterviewsLabel(locale: string, count: number) {
  if (count === 0) {
    return tInterview(locale, "companyPublic.interviews.countNone");
  }

  return tInterview(
    locale,
    count === 1
      ? "companyPublic.interviews.countSingular"
      : "companyPublic.interviews.countPlural",
    { count },
  );
}

const INTERVIEW_WORK_MODE_CONFIG = {
  remote: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
    Icon: IconGlobe,
    theme: "blue",
  },
  hybrid: {
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-500",
    Icon: IconLayers,
    theme: "purple",
  },
  onsite: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    Icon: IconBuilding,
    theme: "green",
  },
} as const;

const INTERVIEW_WORK_MODE_FALLBACK = {
  label: "",
  badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  dot: "bg-violet-500",
  Icon: IconGlobe,
  theme: "purple",
};

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M7 15v2" />
      <path d="M11 11v6" />
      <path d="M15 7v10" />
      <path d="M19 13v4" />
    </svg>
  );
}

function getCardVisual(
  title: string,
  workMode: string,
  theme: string,
  customEmoji: string,
  customTheme: string,
) {
  const value = `${title} ${workMode}`.toLowerCase();

  if (customEmoji || customTheme !== "slate") {
    const normalizedTheme =
      customTheme === "sky"
        ? "blue"
        : customTheme === "mint"
          ? "green"
          : customTheme === "amber"
            ? "amber"
            : customTheme === "violet"
              ? "purple"
              : "slate";

    if (normalizedTheme === "green") {
      return {
        emoji: customEmoji || "🏢",
        hero: "from-emerald-50 via-emerald-50 to-white",
        sparkle: "text-emerald-200",
        button: "text-emerald-700 hover:bg-emerald-600",
        pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }

    if (normalizedTheme === "blue") {
      return {
        emoji: customEmoji || "💻",
        hero: "from-sky-50 via-blue-50 to-white",
        sparkle: "text-sky-200",
        button: "text-blue-700 hover:bg-blue-600",
        pill: "border-blue-200 bg-blue-50 text-blue-700",
      };
    }

    if (normalizedTheme === "amber") {
      return {
        emoji: customEmoji || "⚡",
        hero: "from-amber-50 via-orange-50 to-white",
        sparkle: "text-amber-200",
        button: "text-amber-700 hover:bg-amber-600",
        pill: "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    if (normalizedTheme === "purple") {
      return {
        emoji: customEmoji || "💬",
        hero: "from-violet-50 via-purple-50 to-white",
        sparkle: "text-violet-200",
        button: "text-violet-700 hover:bg-violet-600",
        pill: "border-violet-200 bg-violet-50 text-violet-700",
      };
    }

    return {
      emoji: customEmoji || "✨",
      hero: "from-slate-50 via-white to-white",
      sparkle: "text-slate-300",
      button: "text-slate-700 hover:bg-slate-700",
      pill: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (value.includes("piscina") || value.includes("pool")) {
    return {
      emoji: "🏊‍♂️",
      hero: "from-emerald-50 via-emerald-50 to-white",
      sparkle: "text-emerald-200",
      button: "text-emerald-700 hover:bg-emerald-600",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (value.includes("limpeza") || value.includes("clean")) {
    return {
      emoji: "🧽",
      hero: "from-sky-50 via-blue-50 to-white",
      sparkle: "text-sky-200",
      button: "text-blue-700 hover:bg-blue-600",
      pill: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (theme === "green") {
    return {
      emoji: "🏢",
      hero: "from-emerald-50 via-emerald-50 to-white",
      sparkle: "text-emerald-200",
      button: "text-emerald-700 hover:bg-emerald-600",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (theme === "blue") {
    return {
      emoji: "💻",
      hero: "from-sky-50 via-blue-50 to-white",
      sparkle: "text-sky-200",
      button: "text-blue-700 hover:bg-blue-600",
      pill: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    emoji: "💬",
    hero: "from-violet-50 via-purple-50 to-white",
    sparkle: "text-violet-200",
    button: "text-violet-700 hover:bg-violet-600",
    pill: "border-violet-200 bg-violet-50 text-violet-700",
  };
}

export default function CompanyInterviewsSection({
  locale = "en",
  companySlug,
  interviews,
}: CompanyInterviewsSectionProps) {
  const interviewsCount = interviews.length;
  const sectionTitle = tInterview(
    locale,
    "companyPublic.interviews.sectionTitle",
  );
  const emptyTitle = tInterview(locale, "companyPublic.interviews.emptyTitle");
  const emptyDescription = tInterview(
    locale,
    "companyPublic.interviews.emptyDescription",
  );
  const fallbackDescription = tInterview(
    locale,
    "companyPublic.interviews.fallbackDescription",
  );
  const startLabel = tInterview(locale, "companyPublic.interviews.start");

  return (
    <section id="vagas" className="relative mx-auto max-w-7xl px-6 pb-20 pt-14">
      <div className="mb-10">
        <h2 className="text-[2rem] font-bold tracking-[-0.04em] text-slate-950">
          {sectionTitle}
        </h2>
        <p className="mt-2 text-base text-slate-500">
          {getInterviewsLabel(locale, interviewsCount)}
        </p>
      </div>

      {interviewsCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white px-8 py-24 text-center shadow-sm">
          <p className="font-semibold text-slate-900">{emptyTitle}</p>
          <p className="mt-1.5 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
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

            const savedEmploymentType = normalizeInterviewEmploymentType(
              interview.employment_type,
            );

            const employmentType =
              savedEmploymentType !== "unspecified"
                ? savedEmploymentType
                : extractInterviewEmploymentTypeFromDescription(
                    interview.description,
                  );

            const employmentTypeLabel =
              employmentType === "full_time"
                ? tInterview(
                    locale,
                    "companyPublic.interviews.employmentTypeFullTime",
                  )
                : employmentType === "part_time"
                  ? tInterview(
                      locale,
                      "companyPublic.interviews.employmentTypePartTime",
                    )
                  : employmentType === "contract"
                    ? tInterview(
                        locale,
                        "companyPublic.interviews.employmentTypeContract",
                      )
                    : employmentType === "internship"
                      ? tInterview(
                          locale,
                          "companyPublic.interviews.employmentTypeInternship",
                        )
                      : tInterview(
                          locale,
                          "companyPublic.interviews.employmentTypeFallback",
                        );

            const workModeLabel =
              workMode === "remote"
                ? tInterview(locale, "companyPublic.interviews.workModeRemote")
                : workMode === "hybrid"
                  ? tInterview(
                      locale,
                      "companyPublic.interviews.workModeHybrid",
                    )
                  : workMode === "onsite"
                    ? tInterview(
                        locale,
                        "companyPublic.interviews.workModeOnsite",
                      )
                    : tInterview(
                        locale,
                        "companyPublic.interviews.workModeFallback",
                      );

            const { badge, dot, Icon, theme } = modeConfig;

            const totalQuestions = getInterviewQuestionCount(
              interview.questions,
            );
            const estimatedDuration = estimateInterviewDurationMinutes(
              interview.questions,
            );
            const cleanDescription = stripInterviewMetaFromDescription(
              interview.description,
            );

            const customEmoji =
              String(interview.card_emoji || "").trim() ||
              extractInterviewCardEmojiFromDescription(interview.description);
            const customTheme =
              interview.card_theme
                ? normalizeInterviewCardTheme(interview.card_theme)
                : extractInterviewCardThemeFromDescription(interview.description);
            const experienceLevel =
              interview.experience_level
                ? normalizeInterviewExperienceLevel(interview.experience_level)
                : extractInterviewExperienceLevelFromDescription(
                    interview.description,
                  );
            const experienceLabel =
              experienceLevel === "desired"
                ? tInterview(locale, "companyPublic.interviews.experienceDesired")
                : tInterview(locale, "companyPublic.interviews.experienceNotRequired");

            const visual = getCardVisual(
              interview.title,
              workModeLabel,
              theme,
              customEmoji,
              customTheme,
            );

            return (
              <article
                key={interview.id}
                className="group relative flex min-h-[455px] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] animate-reveal"
                style={{ animationDelay: `${100 + index * 80}ms` }}
              >
                <div className="flex w-full flex-col">
                  <div
                    className={`relative h-[160px] overflow-hidden bg-gradient-to-br ${visual.hero}`}
                  >
                    <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur ${badge}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                        <Icon />
                        {workModeLabel}
                      </span>
                    </div>

                    <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <ClockIcon />
                      {estimatedDuration} min
                    </span>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="translate-y-3 text-[76px] drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                        {visual.emoji}
                      </span>
                    </div>

                    <span
                      className={`absolute left-[26%] top-[48%] text-3xl ${visual.sparkle}`}
                    >
                      ✦
                    </span>
                    <span
                      className={`absolute right-[28%] top-[34%] text-3xl ${visual.sparkle}`}
                    >
                      ✦
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-5 pt-6">
                    <div className="flex-1">
                      <h3 className="text-[1.45rem] font-bold leading-tight tracking-[-0.035em] text-slate-950">
                        {interview.title}
                      </h3>

                      <span
                        className={`mt-5 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${visual.pill}`}
                      >
                        {tInterview(
                          locale,
                          "companyPublic.interviews.employmentTypeLabel",
                        )}
                        : {employmentTypeLabel}
                      </span>

                      {cleanDescription ? (
                        <p className="mt-5 line-clamp-4 text-sm leading-6 text-slate-600">
                          {cleanDescription}
                        </p>
                      ) : (
                        <p className="mt-5 text-sm italic leading-6 text-slate-400">
                          {fallbackDescription}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-2 truncate">
                        <BriefcaseIcon />
                        <span className="truncate">{employmentTypeLabel}</span>
                      </span>

                      <span className="flex items-center gap-2 truncate">
                        <ChartIcon />
                        <span className="truncate">{experienceLabel}</span>
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <ChatIcon />
                        {tInterview(
                          locale,
                          totalQuestions === 1
                            ? "companyPublic.interviews.questionSingular"
                            : "companyPublic.interviews.questionPlural",
                          { count: totalQuestions },
                        )}
                      </span>

                      <Link
                        href={`/${locale}/${companySlug}/interview/${interview.id}`}
                        aria-label={tInterview(
                          locale,
                          "companyPublic.interviews.startAria",
                          { title: interview.title },
                        )}
                        className={`group/link inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold transition-all hover:text-white ${visual.button}`}
                      >
                        {startLabel}
                        <span className="transition-transform duration-200 group-hover/link:translate-x-[2px] group-hover/link:-translate-y-[2px]">
                          <ArrowUpRight />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
