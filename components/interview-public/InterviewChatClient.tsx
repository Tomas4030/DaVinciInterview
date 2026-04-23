"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

type QuestionItem = {
  id: number;
  text: string;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type Props = {
  slug: string;
  interviewId: string;
  interviewTitle: string;
  interviewDescription: string;
  questions: QuestionItem[];
};

type SavedSession = {
  token: string;
  expiresAt: string;
  email?: string;
  telefone?: string;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

const STORAGE_PREFIX = "public_interview_chat_";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="block w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "1.4s" }}
        />
      ))}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ease-out ${
            i < current
              ? "bg-[var(--c-brand)] w-5"
              : i === current
                ? "bg-gray-400 w-3"
                : "bg-gray-200 w-1.5"
          }`}
        />
      ))}
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg
        className="w-3.5 h-3.5 text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg
        className="w-3.5 h-3.5 text-gray-500"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

export default function InterviewChatClient({
  slug,
  interviewId,
  interviewTitle,
  interviewDescription,
  questions,
}: Props) {
  const router = useRouter();
  const storageKey = `${STORAGE_PREFIX}${interviewId}`;
  const sessionStorageKey = `public_interview_session_${interviewId}`;
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [session, setSession] = useState<SavedSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [iteration, setIteration] = useState(1);
  const [responses, setResponses] = useState<
    Array<{
      pergunta_id: number;
      texto_pergunta: string;
      resposta_texto: string;
      duracao_segundos: number;
      timestamp: string;
    }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQuestions = questions.length > 0;

  const introMessage = useMemo(
    () =>
      `Bem-vindo à entrevista para ${interviewTitle}. Esta entrevista tem ${questions.length} pergunta${questions.length === 1 ? "" : "s"}. Quando estiveres pronto, clica em Começar.`,
    [interviewTitle, questions.length],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping]);

  useEffect(() => {
    if (currentIndex >= 0 && !done && !showTyping) {
      textareaRef.current?.focus();
    }
  }, [currentIndex, done, showTyping]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSessionRaw = localStorage.getItem(sessionStorageKey);
    if (!savedSessionRaw) {
      router.replace(`/${slug}/interview/${interviewId}/verify`);
      return;
    }

    let parsedSession: SavedSession;
    try {
      parsedSession = JSON.parse(savedSessionRaw) as SavedSession;
    } catch {
      router.replace(`/${slug}/interview/${interviewId}/verify`);
      return;
    }

    if (!parsedSession?.token || !parsedSession?.expiresAt) {
      router.replace(`/${slug}/interview/${interviewId}/verify`);
      return;
    }

    if (new Date(parsedSession.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(sessionStorageKey);
      router.replace(`/${slug}/interview/${interviewId}/verify`);
      return;
    }

    setSession(parsedSession);

    const savedChatRaw = localStorage.getItem(storageKey);
    if (!savedChatRaw) {
      setMessages([{ id: uid(), role: "bot", text: introMessage }]);
      return;
    }

    try {
      const saved = JSON.parse(savedChatRaw) as {
        messages: ChatMessage[];
        currentIndex: number;
        iteration: number;
        responses: any[];
        done: boolean;
      };

      setMessages(
        saved.messages || [{ id: uid(), role: "bot", text: introMessage }],
      );
      setCurrentIndex(
        typeof saved.currentIndex === "number" ? saved.currentIndex : -1,
      );
      setIteration(typeof saved.iteration === "number" ? saved.iteration : 1);
      setResponses(Array.isArray(saved.responses) ? saved.responses : []);
      setDone(Boolean(saved.done));
    } catch {
      setMessages([{ id: uid(), role: "bot", text: introMessage }]);
    }
  }, [interviewId, introMessage, router, sessionStorageKey, slug, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        messages,
        currentIndex,
        iteration,
        responses,
        done,
      }),
    );
  }, [currentIndex, done, iteration, messages, responses, session, storageKey]);

  async function startInterview() {
    if (!hasQuestions || done) return;
    if (currentIndex >= 0) return;

    setCurrentIndex(0);
    setIteration(1);
    setShowTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setShowTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "bot", text: questions[0].text },
    ]);
  }

  async function finalizeInterview(finalResponses: typeof responses) {
    if (!session) return;

    try {
      await fetch(withBasePath("/api/public/interviews/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          interviewId,
          sessionToken: session.token,
          respostas: finalResponses,
        }),
      });
    } catch (submitError) {
      console.error(submitError);
    }

    setDone(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(sessionStorageKey);
    }
    router.replace(`/${slug}/interview/${interviewId}/done`);
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || loading || done) return;
    if (currentIndex < 0 || currentIndex >= questions.length) return;

    const answer = input.trim();
    if (!answer || answer.length < 2) return;

    setError(null);
    setLoading(true);

    const currentQuestion = questions[currentIndex];
    const nextQuestion = questions[currentIndex + 1]?.text || "";

    const answerPayload = {
      pergunta_id: currentQuestion.id,
      texto_pergunta: currentQuestion.text,
      resposta_texto: answer,
      duracao_segundos: 0,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, answerPayload];

    setMessages((prev) => [...prev, { id: uid(), role: "user", text: answer }]);
    setInput("");
    setShowTyping(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch(
        withBasePath("/api/public/interviews/chat/next"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            interviewId,
            sessionToken: session.token,
            perguntaAtual: currentQuestion.text,
            respostaUser: answer,
            proximaPerguntaBase: nextQuestion,
            iteracaoAtual: iteration,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível continuar a entrevista",
        );
      }

      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "bot", text: data.message || "Vamos continuar." },
      ]);

      if (data.action === "follow_up") {
        setIteration((prev) => prev + 1);
      } else if (data.action === "end_interview") {
        setResponses(updatedResponses);
        await finalizeInterview(updatedResponses);
      } else if (!nextQuestion) {
        setResponses(updatedResponses);
        await finalizeInterview(updatedResponses);
      } else {
        setResponses(updatedResponses);
        setCurrentIndex((prev) => prev + 1);
        setIteration(1);
      }
    } catch (sendError) {
      console.error(sendError);
      setShowTyping(false);
      setError("Não foi possível enviar a tua resposta. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const questionsAnswered = Math.max(currentIndex, 0);

  if (!hasQuestions) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-2xl font-semibold text-[var(--c-text)]">
          {interviewTitle}
        </h1>
        <p className="mt-3 text-sm text-[var(--c-text)]/65">
          Esta entrevista ainda não tem perguntas configuradas.
        </p>
      </main>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gray-50/60 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--c-text)] truncate">
                {interviewTitle}
              </p>
              {interviewDescription ? (
                <p className="text-xs text-[var(--c-text)]/50 truncate">
                  {interviewDescription}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {!done && currentIndex >= 0 && (
              <StepDots current={questionsAnswered} total={questions.length} />
            )}
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                done
                  ? "bg-emerald-50 text-emerald-700"
                  : currentIndex < 0
                    ? "bg-gray-100 text-gray-500"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {done
                ? "Concluída"
                : currentIndex < 0
                  ? "A iniciar"
                  : `${currentIndex + 1} / ${questions.length}`}
            </span>
          </div>
        </div>
      </header>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "bot" ? "justify-start" : "justify-end"}`}
            >
              {message.role === "bot" && <BotAvatar />}
              <div
                className={
                  message.role === "bot"
                    ? "max-w-[72%] bg-white border border-gray-200/80 text-gray-800 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                    : "max-w-[72%] rounded-2xl rounded-tr-md bg-[var(--c-brand)] px-4 py-3 text-sm leading-relaxed text-white"
                }
              >
                {message.text}
              </div>
              {message.role === "user" && <UserAvatar />}
            </div>
          ))}

          {/* Typing indicator */}
          {showTyping && (
            <div className="flex gap-3 items-end">
              <BotAvatar />
              <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          {currentIndex === -1 && !done ? (
            <button
              onClick={startInterview}
              className="w-full h-11 bg-[var(--c-brand)] hover:opacity-90 active:scale-[0.99] text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-150"
              type="button"
            >
              Começar entrevista
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          ) : done ? null : (
            <>
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all duration-150"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Escreve a tua resposta…"
                  disabled={loading || showTyping || done || currentIndex < 0}
                  className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 min-h-[28px] max-h-[120px] py-1 leading-snug disabled:opacity-50"
                  style={{ height: "28px" }}
                />
                <button
                  type="submit"
                  disabled={
                    loading ||
                    showTyping ||
                    done ||
                    !input.trim() ||
                    currentIndex < 0
                  }
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--c-brand)] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-150"
                  aria-label="Enviar"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                    />
                  </svg>
                </button>
              </form>
              <p className="text-center text-[11px] text-gray-300 mt-2.5 tracking-wide">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </>
          )}

          {error ? (
            <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
