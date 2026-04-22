"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import {
  normalizeInterviewWorkMode,
  type InterviewWorkMode,
} from "@/lib/interview-meta";

type Mode = "create" | "edit";

type Props = {
  slug: string;
  mode: Mode;
  interviewId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialWorkMode?: InterviewWorkMode;
  initialStatus?: "draft" | "published" | "archived";
  initialQuestionsText?: string;
};

function parseQuestionsText(value: string): string[] {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampQuestionCount(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(20, Math.floor(value)));
}

export default function AdminInterviewForm({
  slug,
  mode,
  interviewId,
  initialTitle = "",
  initialDescription = "",
  initialWorkMode = "unspecified",
  initialStatus = "draft",
  initialQuestionsText = "",
}: Props) {
  const router = useRouter();
  const initialQuestions = parseQuestionsText(initialQuestionsText);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [workMode, setWorkMode] = useState<InterviewWorkMode>(
    normalizeInterviewWorkMode(initialWorkMode),
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
      ? clampQuestionCount(initialQuestions.length)
      : 5,
  );
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          workMode,
          status,
          questions: normalizedQuestions,
          questionsText: normalizedQuestions.join("\n"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Não foi possível guardar a entrevista");
        return;
      }

      router.push(`/admin/${slug}/interviews`);
      router.refresh();
    } catch (requestError) {
      console.error("Erro ao guardar entrevista:", requestError);
      setError("Erro ao guardar entrevista");
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

  async function generateQuestionsWithAIPlaceholder() {
    setGenerating(true);
    setError("");

    const count = clampQuestionCount(desiredQuestionCount);
    const role = title.trim() || "a vaga";

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const templates = [
        `Fala sobre a tua experiência mais relevante para ${role}.`,
        `Como organizas prioridades e entregas quando tens prazos curtos?`,
        `Descreve um desafio técnico/profissional recente e como o resolveste.`,
        `Que competências consideras essenciais para ter sucesso em ${role}?`,
        `Como colaboras com equipas multidisciplinares em projetos complexos?`,
        `Que resultados concretos já alcançaste em funções semelhantes?`,
        `Como lidas com feedback e iteração contínua no teu trabalho?`,
        `Que ferramentas e práticas usas para garantir qualidade no teu trabalho?`,
      ];

      const generated = Array.from({ length: count }).map((_, index) => {
        const template = templates[index % templates.length];
        return template;
      });

      setQuestions(generated);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="interview-title"
          className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
        >
          Titulo
        </label>
        <input
          id="interview-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
          placeholder="Ex: Frontend Developer"
        />
      </div>

      <div>
        <label
          htmlFor="interview-description"
          className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
        >
          Descricao
        </label>
        <textarea
          id="interview-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-base min-h-24 border-[var(--c-border)] bg-[var(--c-bg)]"
          placeholder="Resumo da vaga"
        />
      </div>

      <div>
        <label
          htmlFor="interview-work-mode"
          className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
        >
          Regime de trabalho
        </label>
        <select
          id="interview-work-mode"
          value={workMode}
          onChange={(event) =>
            setWorkMode(normalizeInterviewWorkMode(event.target.value))
          }
          className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
        >
          <option value="unspecified">Nao definido</option>
          <option value="remote">Remoto</option>
          <option value="hybrid">Hibrido</option>
          <option value="onsite">Presencial</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="interview-status"
          className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
        >
          Estado
        </label>
        <select
          id="interview-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "draft" | "published" | "archived")
          }
          className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicada</option>
          <option value="archived">Arquivada</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="desired-questions"
          className="mb-1.5 block text-xs font-medium text-[var(--c-muted)]"
        >
          Número de perguntas desejado
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input
            id="desired-questions"
            type="number"
            min={1}
            max={20}
            value={desiredQuestionCount}
            onChange={(event) =>
              setDesiredQuestionCount(
                clampQuestionCount(Number(event.target.value || 1)),
              )
            }
            className="input-base w-32 border-[var(--c-border)] bg-[var(--c-bg)]"
          />

          <button
            type="button"
            onClick={generateQuestionsWithAIPlaceholder}
            disabled={generating}
            className="rounded-md border border-[var(--c-brand)]/20 bg-[var(--c-brand-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--c-brand-dark)] transition-colors hover:brightness-[0.98] disabled:opacity-60"
          >
            {generating
              ? "A gerar perguntas..."
              : "Gerar perguntas com IA (placeholder)"}
          </button>
        </div>
      </div>

      <section className="overflow-hidden ">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-[0.8rem] font-semibold text-[var(--c-text)]">
            Perguntas
            <span className="ml-2 text-[11px] font-normal text-[var(--c-muted)]">
              {questions.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-3 p-5">
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
                "group/pergunta flex items-start gap-3 rounded-[10px] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2.5 animate-reveal",
                draggedQuestionIndex === index
                  ? "cursor-grabbing"
                  : "cursor-grab",
                dragOverQuestionIndex === index
                  ? "border-[var(--c-brand)]/25 bg-[var(--c-brand-soft)]/45"
                  : "",
              ].join(" ")}
              style={{ animationDelay: `${index * 25}ms` }}
            >
              <span className="mt-3 flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md border border-[var(--c-border)] bg-[var(--c-bg)] text-[10px] font-bold tabular-nums text-[var(--c-muted)]">
                {index + 1}
              </span>

              <textarea
                value={question}
                onChange={(event) => updateQuestion(index, event.target.value)}
                rows={2}
                className="min-h-20 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-7 text-[var(--c-text)] placeholder:text-[var(--c-muted)] focus:outline-none"
                placeholder={`Pergunta ${index + 1}…`}
              />

              <div className="flex flex-col gap-1 pt-1 opacity-100">
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  title="Remover"
                  className="inline-flex min-w-[70px] items-center justify-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-red-700 transition-colors hover:bg-red-100"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary inline-flex px-5 py-2.5"
      >
        {loading
          ? "A guardar..."
          : mode === "create"
            ? "Criar entrevista"
            : "Guardar alterações"}
      </button>
    </form>
  );
}
