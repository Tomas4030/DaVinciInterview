import Link from "next/link";
import type { InterviewRecord } from "@/lib/queries/interviews";
import {
  extractInterviewCardEmojiFromDescription,
  extractInterviewCardThemeFromDescription,
  extractInterviewExperienceLevelFromDescription,
  normalizeInterviewCardTheme,
  normalizeInterviewExperienceLevel,
  stripInterviewMetaFromDescription,
} from "@/lib/interview-meta";
import { tAdmin } from "@/lib/i18n/admin";
import ArchiveInterviewButton from "../ArchiveInterviewButton";
import DeleteInterviewButton from "../DeleteInterviewButton";
import InterviewStatusBadge from "./InterviewStatusBadge";

type Props = {
  slug: string;
  item: InterviewRecord;
  locale?: string;
};

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 2v4M16 2v4M3 10h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getVisual(theme: string, emoji: string) {
  if (theme === "mint") {
    return {
      emoji: emoji || "🏊‍♂️",
      bg: "from-emerald-50 to-green-100",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "bg-emerald-600 text-white",
    };
  }

  if (theme === "sky") {
    return {
      emoji: emoji || "🧽",
      bg: "from-sky-50 to-blue-100",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      icon: "bg-blue-600 text-white",
    };
  }

  if (theme === "amber") {
    return {
      emoji: emoji || "⚡",
      bg: "from-amber-50 to-orange-100",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-600 text-white",
    };
  }

  if (theme === "violet") {
    return {
      emoji: emoji || "💬",
      bg: "from-violet-50 to-purple-100",
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      icon: "bg-violet-600 text-white",
    };
  }

  return {
    emoji: emoji || "✨",
    bg: "from-slate-50 to-slate-100",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    icon: "bg-slate-600 text-white",
  };
}

export default function InterviewListCard({
  slug,
  item,
  locale = "en",
}: Props) {
  const description =
    stripInterviewMetaFromDescription(item.description) ||
    tAdmin(locale, "interviews.listCard.noDescription");

  const theme = item.card_theme
    ? normalizeInterviewCardTheme(item.card_theme)
    : extractInterviewCardThemeFromDescription(item.description);
  const emoji = String(item.card_emoji || "").trim() || extractInterviewCardEmojiFromDescription(item.description);
  const visual = getVisual(theme, emoji);
  const estimatedMinutes = Math.max(5, item.questions.length * 1);
  const experienceLevel = item.experience_level
    ? normalizeInterviewExperienceLevel(item.experience_level)
    : extractInterviewExperienceLevelFromDescription(item.description);
  const experienceLabel =
    experienceLevel === "desired"
      ? tAdmin(locale, "interviews.listCard.experienceDesired")
      : tAdmin(locale, "interviews.listCard.experienceNotRequired");

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
      <div className="grid gap-6 lg:grid-cols-[190px_1fr_340px] lg:items-center">
        <div
          className={`relative flex h-[150px] items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-gradient-to-br ${visual.bg}`}
        >
          <span className="absolute left-7 top-8 text-2xl text-white/80">
            ✦
          </span>
          <span className="absolute right-7 top-10 text-2xl text-white/80">
            ✦
          </span>

          <span className="text-[72px] drop-shadow-sm">
            {visual.emoji}
          </span>

          <span
            className={`absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full shadow-lg ${visual.icon}`}
          >
            <CalendarIcon />
          </span>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="truncate text-xl font-bold tracking-[-0.03em] text-slate-950">
              {item.title}
            </h2>

            <InterviewStatusBadge status={item.status} locale={locale} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${visual.badge}`}
            >
              <QuestionIcon />
              {tAdmin(
                locale,
                item.questions.length === 1
                  ? "interviews.listCard.questionSingular"
                  : "interviews.listCard.questionPlural",
                { count: item.questions.length },
              )}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${visual.badge}`}
            >
              <ClockIcon />~ {estimatedMinutes} min
            </span>
          </div>

          <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon />
              {experienceLabel}
            </span>
          </div>
        </div>

        <div className="flex h-full w-full flex-col lg:items-end">
          <div className="mt-auto grid w-full grid-cols-2 gap-3 lg:max-w-[330px]">
            <Link
              href={`/${locale}/admin/${slug}/responses?interviewId=${item.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <EyeIcon />
              {tAdmin(locale, "interviews.listCard.viewResponses")}
            </Link>

            <Link
              href={`/${locale}/admin/${slug}/interviews/${item.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-50"
            >
              <EditIcon />
              {tAdmin(locale, "interviews.listCard.edit")}
            </Link>

            <ArchiveInterviewButton
              slug={slug}
              interviewId={item.id}
              currentStatus={item.status}
              locale={locale}
            />

            <DeleteInterviewButton
              slug={slug}
              interviewId={item.id}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
