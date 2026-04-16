"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Vaga } from "@/lib/api";
import { BASE_PATH } from "@/lib/base-path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mensagem {
  id: string;
  tipo: "bot" | "user";
  texto: string;
  timestamp: Date;
}

function uuid() {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
function msgBot(texto: string | null | undefined): Mensagem {
  return {
    id: uuid(),
    tipo: "bot",
    texto: texto || "Mensagem indisponível",
    timestamp: new Date(),
  };
}
function msgUser(texto: string | null | undefined): Mensagem {
  return {
    id: uuid(),
    tipo: "user",
    texto: texto || "",
    timestamp: new Date(),
  };
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string | null | undefined) {
  if (!text || typeof text !== "string") {
    return (
      <span className="text-gray-500 italic">
        Desculpa, houve um erro ao processar a mensagem.
      </span>
    );
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return (
      <span className="text-gray-500 italic">
        Desculpa, a mensagem chegou vazia.
      </span>
    );
  }
  const parts = trimmed.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part === "\n") return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

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

// ─── Message bubble ───────────────────────────────────────────────────────────

function MensagemItem({ msg, isLast }: { msg: Mensagem; isLast: boolean }) {
  const isBot = msg.tipo === "bot";
  return (
    <div
      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} ${
        isLast ? "animate-slide-up" : ""
      }`}
    >
      {isBot && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center">
            <span className="text-white text-[11px] font-semibold tracking-tight font-display">
              D
            </span>
          </div>
        </div>
      )}
      <div
        className={`
          max-w-[72%] text-sm leading-relaxed
          ${
            isBot
              ? "bg-white border border-gray-200/80 text-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              : "bg-[var(--c-brand)] text-gray-100 rounded-2xl rounded-tr-md px-4 py-3"
          }
        `}
      >
        {renderMarkdown(msg.texto)}
      </div>
      {!isBot && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-gray-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step dots progress ───────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`
            h-1 rounded-full transition-all duration-500 ease-out
            ${
              i < current
                ? "bg-[var(--c-brand)] w-5"
                : i === current
                  ? "bg-gray-400 w-3"
                  : "bg-gray-200 w-1.5"
            }
          `}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatEntrevista({
  vaga,
  candidateEmail,
  candidatePhone,
}: {
  vaga: Vaga;
  candidateEmail?: string;
  candidatePhone?: string;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    msgBot(
      `Olá! 👋 Bem-vindo à entrevista para a vaga de **${vaga.titulo}**.\n\nEsta entrevista tem ${vaga.perguntas.length} pergunta${vaga.perguntas.length !== 1 ? "s" : ""} e demora aproximadamente ${vaga.duracao_min} minutos.\n\nResponde ao teu ritmo — não há tempo limite. Quando estiveres pronto, clica em **Começar**.`,
    ),
  ]);
  const [input, setInput] = useState("");
  const [indiceAtual, setIndiceAtual] = useState(-1);
  const [iteracaoPerguntaAtual, setIteracaoPerguntaAtual] = useState(1);
  const [concluida, setConcluida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarTyping, setMostrarTyping] = useState(false);
  const [sessaoId] = useState<string>(uuid);

  const [respostasFinalizadas, setRespostasFinalizadas] = useState<
    {
      pergunta_id: number;
      texto_pergunta: string;
      resposta_texto: string;
      duracao_segundos: number;
      timestamp: string;
    }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, mostrarTyping]);

  useEffect(() => {
    if (indiceAtual >= 0 && !concluida && !mostrarTyping) {
      textareaRef.current?.focus();
    }
  }, [indiceAtual, concluida, mostrarTyping]);

  const adicionarMensagem = useCallback((msg: Mensagem) => {
    setMensagens((prev) => [...prev, msg]);
  }, []);

  const botResponde = useCallback(
    (texto: string, delay = 800) => {
      setMostrarTyping(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setMostrarTyping(false);
          adicionarMensagem(msgBot(texto));
          resolve();
        }, delay);
      });
    },
    [adicionarMensagem],
  );

  async function comecar() {
    setIndiceAtual(0);
    setIteracaoPerguntaAtual(1);
    // Na primeira pergunta, a IA ainda não reformulou nada — mostra diretamente
    await botResponde(vaga.perguntas[0].texto, 500);
  }

  async function concluirEntrevista(
    respostasFinal: typeof respostasFinalizadas,
  ) {
    if (candidateEmail && candidatePhone) {
      await fetch(`${BASE_PATH}/api/candidatos/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: candidateEmail,
          telefone: candidatePhone,
          vaga_id: vaga.id,
          sessao_id: sessaoId,
          respostas: respostasFinal,
        }),
      }).catch((err) => console.error("Erro ao criar candidatura:", err));
    }
    await botResponde(
      `Entrevista concluída! 🎉\n\nObrigado pela tua participação. As tuas respostas foram guardadas e serão analisadas pela nossa equipa em breve.\n\nBoa sorte! 🍀`,
    );
    setConcluida(true);
  }

  async function enviarResposta() {
    const texto = input.trim();
    if (!texto || enviando || concluida) return;
    if (texto.length < 2) return;

    setEnviando(true);
    adicionarMensagem(msgUser(texto));
    setInput("");

    const perguntaAtual = vaga.perguntas[indiceAtual].texto;
    const proximoIndice = indiceAtual + 1;
    const isUltimaPergunta = proximoIndice >= vaga.perguntas.length;

    const respostaAtual = {
      pergunta_id: vaga.perguntas[indiceAtual].id,
      texto_pergunta: perguntaAtual,
      resposta_texto: texto,
      duracao_segundos: 0,
      timestamp: new Date().toISOString(),
    };
    // ── Chamar a IA para decidir: follow-up ou próxima pergunta ─────────────
    try {
      const response = await fetch("/api/entrevista/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vagaTitulo: vaga.titulo,
          perguntaAtual: perguntaAtual,
          respostaUser: texto,
          proximaPerguntaBase: isUltimaPergunta
            ? ""
            : vaga.perguntas[proximoIndice].texto,
          iteracaoAtual: iteracaoPerguntaAtual,
        }),
      });

      const data = await response.json();
      const action: string = data.action || "next_question";

      const message =
        data.message && typeof data.message === "string" && data.message.trim()
          ? data.message
          : null;

      if (action === "follow_up" && message) {
        await botResponde(message, 800);
        setIteracaoPerguntaAtual(iteracaoPerguntaAtual + 1);
      } else if (action === "end_interview") {
        const respostasFinal = [...respostasFinalizadas, respostaAtual];
        setRespostasFinalizadas(respostasFinal);

        if (message) {
          await botResponde(message, 800);
        }

        await concluirEntrevista(respostasFinal);
      } else {
        const respostasFinal = [...respostasFinalizadas, respostaAtual];
        setRespostasFinalizadas(respostasFinal);

        if (message) {
          await botResponde(message, 800);
        }

        setIndiceAtual(proximoIndice);
        setIteracaoPerguntaAtual(1);
      }
    } catch (error) {
      console.error("Erro ao obter próxima pergunta:", error);
      const respostasFinal = [...respostasFinalizadas, respostaAtual];
      setRespostasFinalizadas(respostasFinal);

      await botResponde(
        `Obrigado. ${vaga.perguntas[proximoIndice].texto}`,
        800,
      );
      setIndiceAtual(proximoIndice);
      setIteracaoPerguntaAtual(1);
    }

    setEnviando(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarResposta();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const perguntasRespondidas = indiceAtual < 0 ? 0 : indiceAtual;

  return (
    <div className="flex flex-col h-screen bg-gray-50/60">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex-shrink-0 w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[11px] font-semibold font-display">
                  D
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 truncate">
                {vaga.titulo}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {!concluida && indiceAtual >= 0 && (
              <StepDots
                current={perguntasRespondidas}
                total={vaga.perguntas.length}
              />
            )}
            <span
              className={`
                text-xs font-medium px-2.5 py-1 rounded-md
                ${
                  concluida
                    ? "bg-emerald-50 text-emerald-700"
                    : indiceAtual < 0
                      ? "bg-gray-100 text-gray-500"
                      : "bg-gray-100 text-gray-600"
                }
              `}
            >
              {concluida
                ? "Concluída"
                : indiceAtual < 0
                  ? "A iniciar"
                  : `${indiceAtual + 1} / ${vaga.perguntas.length}`}
            </span>
          </div>
        </div>
      </header>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">
          {mensagens.map((msg, i) => (
            <MensagemItem
              key={msg.id}
              msg={msg}
              isLast={i === mensagens.length - 1}
            />
          ))}
          {mostrarTyping && (
            <div className="flex gap-3 items-end animate-fade-in">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center">
                  <span className="text-white text-[11px] font-semibold font-display">
                    D
                  </span>
                </div>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          {indiceAtual === -1 && !concluida ? (
            <button
              onClick={comecar}
              className="w-full h-11 bg-[var(--c-brand)] hover:bg-gray-800 active:scale-[0.99] text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-150"
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
          ) : concluida ? (
            <Link
              href="/"
              className="w-full h-11 border border-gray-200 hover:bg-gray-50 active:scale-[0.99] text-gray-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-150"
            >
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
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              Ver outras vagas
            </Link>
          ) : (
            <>
              <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all duration-150">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve a tua resposta…"
                  disabled={enviando || mostrarTyping}
                  className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 min-h-[28px] max-h-[120px] py-1 leading-snug disabled:opacity-50"
                  style={{ height: "28px" }}
                />
                <button
                  onClick={enviarResposta}
                  disabled={!input.trim() || enviando || mostrarTyping}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--c-brand)] hover:bg-gray-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--c-brand)] disabled:active:scale-100 text-white flex items-center justify-center transition-all duration-150"
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
              </div>
              <p className="text-center text-[11px] text-gray-300 mt-2.5 tracking-wide">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
