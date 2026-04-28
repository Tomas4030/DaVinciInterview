"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";
import {
  normalizeInterviewCardTheme,
  normalizeInterviewEmploymentType,
  normalizeInterviewExperienceLevel,
  type InterviewEmploymentType,
  type InterviewCardTheme,
  type InterviewExperienceLevel,
  normalizeInterviewWorkMode,
  type InterviewWorkMode,
} from "@/lib/interview-meta";
import type { CompanyPlan } from "@/lib/queries/companies";

type Mode = "create" | "edit";

type Props = {
  slug: string;
  mode: Mode;
  interviewId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialInterviewContext?: string;
  initialEmploymentType?: InterviewEmploymentType;
  initialWorkMode?: InterviewWorkMode;
  initialExperienceLevel?: InterviewExperienceLevel;
  initialCardEmoji?: string;
  initialCardTheme?: InterviewCardTheme;
  initialStatus?: "draft" | "published" | "archived";
  initialQuestionsText?: string;
  companyPlan?: CompanyPlan;
  locale?: string;
};

function resolveInitialWorkMode(
  value: InterviewWorkMode,
): "remote" | "hybrid" | "onsite" {
  if (value === "remote" || value === "hybrid" || value === "onsite") {
    return value;
  }
  return "remote";
}

function parseQuestionsText(value: string): string[] {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampQuestionCount(value: number, max: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(max, Math.floor(value)));
}

export default function AdminInterviewForm({
  slug,
  mode,
  interviewId,
  initialTitle = "",
  initialDescription = "",
  initialInterviewContext = "",
  initialEmploymentType = "unspecified",
  initialWorkMode = "unspecified",
  initialExperienceLevel = "not_required",
  initialCardEmoji = "✨",
  initialCardTheme = "slate",
  initialStatus = "draft",
  initialQuestionsText = "",
  companyPlan = "basic",
  locale = "en",
}: Props) {
  function resolveFriendlyError(message: string): string {
    const normalized = String(message || "").toLowerCase();
    if (normalized.includes("plano free permite apenas 1 entrevista ativa")) {
      return tAdmin(locale, "interviewForm.limitFreeActiveInterview");
    }
    if (normalized.includes("plano basic permite até 5 entrevistas ativas")) {
      return tAdmin(locale, "interviewForm.limitBasicActiveInterviews");
    }
    if (normalized.includes("plano free nao inclui geracao de perguntas")) {
      return tAdmin(locale, "interviewForm.limitFreeAiGeneration");
    }
    if (normalized.includes("ia nao devolveu perguntas suficientes")) {
      return tAdmin(locale, "interviewForm.aiGenerateEmpty");
    }
    return message;
  }

  const maxQuestionsByPlan = companyPlan === "free" ? 5 : 20;
  const router = useRouter();
  const initialQuestions = parseQuestionsText(initialQuestionsText);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [interviewContext, setInterviewContext] = useState(
    initialInterviewContext,
  );
  const [employmentType, setEmploymentType] = useState<InterviewEmploymentType>(
    normalizeInterviewEmploymentType(initialEmploymentType),
  );
  const [workMode, setWorkMode] = useState<"remote" | "hybrid" | "onsite">(
    resolveInitialWorkMode(normalizeInterviewWorkMode(initialWorkMode)),
  );
  const [experienceLevel, setExperienceLevel] =
    useState<InterviewExperienceLevel>(
      normalizeInterviewExperienceLevel(initialExperienceLevel),
    );
  const [cardEmoji, setCardEmoji] = useState(
    String(initialCardEmoji || "✨").trim() || "✨",
  );
  const [cardTheme, setCardTheme] = useState<InterviewCardTheme>(
    normalizeInterviewCardTheme(initialCardTheme),
  );
  const [status, setStatus] = useState(initialStatus);
  const [questions, setQuestions] = useState<string[]>(
    initialQuestions.length > 0 ? initialQuestions : [""],
  );
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<
    number | null
  >(null);
  const [dragOverQuestionIndex, setDragOverQuestionIndex] = useState<
    number | null
  >(null);
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number>(
    initialQuestions.length > 0
      ? clampQuestionCount(initialQuestions.length, maxQuestionsByPlan)
      : 5,
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [submitAction, setSubmitAction] = useState<"default" | "publish">(
    "default",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const endpoint =
    mode === "create"
      ? withBasePath(`/api/companies/${slug}/interviews`)
      : withBasePath(`/api/companies/${slug}/interviews/${interviewId}`);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const normalizedQuestions = questions
      .map((item) => item.trim())
      .filter(Boolean);
    const statusToSave = submitAction === "publish" ? "published" : status;

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          interviewContext,
          employmentType,
          workMode,
          experienceLevel,
          cardEmoji,
          cardTheme,
          status: statusToSave,
          questions: normalizedQuestions,
          questionsText: normalizedQuestions.join("\n"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const rawError = String(data?.error || "").trim();
        setError(
          rawError
            ? resolveFriendlyError(rawError)
            : tAdmin(locale, "interviewForm.defaultError"),
        );
        return;
      }

      router.push(`/${locale}/admin/${slug}/interviews`);
      router.refresh();
    } catch (requestError) {
      console.error("Erro ao guardar entrevista:", requestError);
      setError(tAdmin(locale, "interviewForm.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function updateQuestion(index: number, value: string) {
    setQuestions((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, ""]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function moveQuestionByDrag(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    setQuestions((current) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleDragStart(index: number) {
    setDraggedQuestionIndex(index);
    setDragOverQuestionIndex(index);
  }

  function handleDragEnter(index: number) {
    if (draggedQuestionIndex === null) return;
    setDragOverQuestionIndex(index);
  }

  function handleDragEnd() {
    setDraggedQuestionIndex(null);
    setDragOverQuestionIndex(null);
  }

  async function generateQuestionsWithAI() {
    setGenerating(true);
    setError("");

    const count = clampQuestionCount(desiredQuestionCount, maxQuestionsByPlan);
    if (!title.trim()) {
      setError(tAdmin(locale, "interviewForm.aiTitleRequired"));
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch(withBasePath("/api/ai/generate-questions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companySlug: slug,
          jobTitle: title,
          jobDescription: description,
          interviewContext,
          questionCount: count,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const rawError = String(data?.error || "").trim();
        setError(
          rawError
            ? resolveFriendlyError(rawError)
            : tAdmin(locale, "interviewForm.aiGenerateError"),
        );
        return;
      }

      const nextQuestions = Array.isArray(data?.questions)
        ? data.questions
            .map((item: any) => String(item?.question || "").trim())
            .filter(Boolean)
        : [];

      if (nextQuestions.length === 0) {
        setError(tAdmin(locale, "interviewForm.aiGenerateEmpty"));
        return;
      }

      setQuestions(nextQuestions.slice(0, count));
    } catch (requestError) {
      console.error("Erro ao gerar perguntas com IA:", requestError);
      setError(tAdmin(locale, "interviewForm.aiGenerateError"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-0">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              📋
            </span>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
              1. {tAdmin(locale, "interviewForm.sectionMainInfo")}
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="interview-title"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.titleLabel")}
              </label>
              <input
                id="interview-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder={tAdmin(locale, "interviewForm.titlePlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="interview-description"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.descriptionLabel")}
              </label>
              <textarea
                id="interview-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[170px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder={tAdmin(
                  locale,
                  "interviewForm.descriptionPlaceholder",
                )}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              💼
            </span>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
              2. {tAdmin(locale, "interviewForm.sectionRoleDetails")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="interview-work-mode"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.workModeLabel")}
              </label>
              <select
                id="interview-work-mode"
                value={workMode}
                onChange={(event) =>
                  setWorkMode(
                    resolveInitialWorkMode(
                      normalizeInterviewWorkMode(event.target.value),
                    ),
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="remote">
                  {tAdmin(locale, "interviewForm.workModeRemote")}
                </option>
                <option value="hybrid">
                  {tAdmin(locale, "interviewForm.workModeHybrid")}
                </option>
                <option value="onsite">
                  {tAdmin(locale, "interviewForm.workModeOnsite")}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interview-employment-type"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.employmentTypeLabel")}
              </label>
              <select
                id="interview-employment-type"
                value={employmentType}
                onChange={(event) =>
                  setEmploymentType(
                    normalizeInterviewEmploymentType(event.target.value),
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="unspecified">
                  {tAdmin(locale, "interviewForm.employmentTypeUnspecified")}
                </option>
                <option value="full_time">
                  {tAdmin(locale, "interviewForm.employmentTypeFullTime")}
                </option>
                <option value="part_time">
                  {tAdmin(locale, "interviewForm.employmentTypePartTime")}
                </option>
                <option value="contract">
                  {tAdmin(locale, "interviewForm.employmentTypeContract")}
                </option>
                <option value="internship">
                  {tAdmin(locale, "interviewForm.employmentTypeInternship")}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interview-context"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.contextLabel")}
              </label>
              <input
                id="interview-context"
                type="text"
                value={interviewContext}
                onChange={(event) => setInterviewContext(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder={tAdmin(locale, "interviewForm.contextPlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="interview-experience-level"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.experienceLevelLabel")}
              </label>
              <select
                id="interview-experience-level"
                value={experienceLevel}
                onChange={(event) =>
                  setExperienceLevel(
                    normalizeInterviewExperienceLevel(event.target.value),
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="desired">
                  {tAdmin(locale, "interviewForm.experienceLevelDesired")}
                </option>
                <option value="not_required">
                  {tAdmin(locale, "interviewForm.experienceLevelNotRequired")}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interview-card-theme"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.cardThemeLabel")}
              </label>
              <select
                id="interview-card-theme"
                value={cardTheme}
                onChange={(event) =>
                  setCardTheme(normalizeInterviewCardTheme(event.target.value))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="sky">
                  {tAdmin(locale, "interviewForm.cardThemeSky")}
                </option>
                <option value="mint">
                  {tAdmin(locale, "interviewForm.cardThemeMint")}
                </option>
                <option value="violet">
                  {tAdmin(locale, "interviewForm.cardThemeViolet")}
                </option>
                <option value="amber">
                  {tAdmin(locale, "interviewForm.cardThemeAmber")}
                </option>
                <option value="slate">
                  {tAdmin(locale, "interviewForm.cardThemeSlate")}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="interview-card-emoji"
                className="mb-2 block text-xs font-semibold text-slate-500"
              >
                {tAdmin(locale, "interviewForm.cardEmojiLabel")}
              </label>
              <input
                id="interview-card-emoji"
                type="text"
                value={cardEmoji}
                onChange={(event) =>
                  setCardEmoji(event.target.value.slice(0, 8))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                placeholder={tAdmin(
                  locale,
                  "interviewForm.cardEmojiPlaceholder",
                )}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                ✨
              </span>
              <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
                3. {tAdmin(locale, "interviewForm.sectionAiGeneration")}
              </h2>
            </div>

            <label
              htmlFor="desired-questions"
              className="mb-2 block text-xs font-semibold text-slate-500"
            >
              {tAdmin(locale, "interviewForm.desiredQuestions")}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <input
                id="desired-questions"
                type="number"
                min={1}
                max={maxQuestionsByPlan}
                value={desiredQuestionCount}
                onChange={(event) =>
                  setDesiredQuestionCount(
                    clampQuestionCount(
                      Number(event.target.value || 1),
                      maxQuestionsByPlan,
                    ),
                  )
                }
                className="h-12 w-36 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={generateQuestionsWithAI}
                disabled={generating}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-[0_14px_35px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:opacity-60"
              >
                ⚡{" "}
                {generating
                  ? tAdmin(locale, "interviewForm.generating")
                  : tAdmin(locale, "interviewForm.generateAction")}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-violet-500">✨</div>

              <div>
                <p className="font-medium text-slate-900">
                  {tAdmin(locale, "interviewForm.aiInfoTitle")}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {tAdmin(locale, "interviewForm.aiInfoDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              💬
            </span>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
              4. {tAdmin(locale, "interviewForm.questionsTitle")}
              <span className="ml-2 text-sm font-medium text-slate-400">
                {questions.length}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            + {tAdmin(locale, "interviewForm.addQuestion")}
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedQuestionIndex === null) return;
                moveQuestionByDrag(draggedQuestionIndex, index);
                handleDragEnd();
              }}
              onDragEnd={handleDragEnd}
              className={[
                "group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition",
                draggedQuestionIndex === index
                  ? "cursor-grabbing"
                  : "cursor-grab",
                dragOverQuestionIndex === index
                  ? "border-blue-300 bg-blue-50"
                  : "",
              ].join(" ")}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">
                {index + 1}
              </span>

              <textarea
                value={question}
                onChange={(event) => updateQuestion(index, event.target.value)}
                rows={1}
                className="min-h-[44px] flex-1 resize-none bg-transparent text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
                placeholder={tAdmin(
                  locale,
                  "interviewForm.questionPlaceholder",
                  {
                    number: index + 1,
                  },
                )}
              />

              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                🗑 {tAdmin(locale, "interviewForm.deleteQuestion")}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          {tAdmin(locale, "interviewForm.reorderHint")}
        </p>
      </section>

      <div className="fix bottom-4 z-30 mt-8 rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/${slug}/interviews`)}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {tAdmin(locale, "interviewForm.cancel")}
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              onClick={() => setSubmitAction("default")}
              className="rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
            >
              💾{" "}
              {loading
                ? tAdmin(locale, "interviewForm.saving")
                : mode === "create"
                  ? tAdmin(locale, "interviewForm.create")
                  : tAdmin(locale, "interviewForm.save")}
            </button>

            <button
              type="submit"
              disabled={loading}
              onClick={() => setSubmitAction("publish")}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:opacity-60"
            >
              🚀{" "}
              {mode === "create"
                ? tAdmin(locale, "interviewForm.createAndPublish")
                : tAdmin(locale, "interviewForm.saveAndPublish")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
