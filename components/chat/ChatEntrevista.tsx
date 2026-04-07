"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Vaga } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Mensagem {
  id: string;
  tipo: "bot" | "user";
  texto: string;
  timestamp: Date;
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function uuid() {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function msgBot(texto: string): Mensagem {
  return { id: uuid(), tipo: "bot", texto, timestamp: new Date() };
}
function msgUser(texto: string): Mensagem {
  return { id: uuid(), tipo: "user", texto, timestamp: new Date() };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-white text-xs font-bold font-display">D</span>
    </div>
  );
}

function MensagemItem({ msg }: { msg: Mensagem }) {
  const isBot = msg.tipo === "bot";

  return (
    <div
      className={`flex items-end gap-2 animate-slide-up ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && <BotAvatar />}

      <div
        className={`max-w-[78%] ${isBot ? "bubble-bot" : "bubble-user"} px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}
      >
        {msg.texto}
      </div>

      {!isBot && (
        <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-500 text-xs font-medium">Tu</span>
        </div>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [indiceAtual, setIndiceAtual] = useState(-1); // -1 = intro
  const [concluida, setConcluida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarTyping, setMostrarTyping] = useState(false);
  const [sessaoId] = useState<string>(uuid);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, mostrarTyping]);

  // Auto-focus no textarea após cada pergunta do bot
  useEffect(() => {
    if (indiceAtual >= 0 && !concluida && !mostrarTyping) {
      textareaRef.current?.focus();
    }
  }, [indiceAtual, concluida, mostrarTyping]);

  const adicionarMensagem = useCallback((msg: Mensagem) => {
    setMensagens((prev) => [...prev, msg]);
  }, []);

  // Simula o bot a "escrever" antes de mostrar a mensagem
  const botResponde = useCallback(
    (texto: string, delay = 700) => {
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
    await botResponde(vaga.perguntas[0].texto, 500);
  }

  async function guardarResposta(perguntaId: number, resposta: string) {
    try {
      await fetch("/api/respostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaga_id: vaga.id,
          pergunta_id: perguntaId,
          resposta,
          sessao_id: sessaoId,
        }),
      });
    } catch (err) {
      console.error("Erro ao guardar resposta:", err);
    }
  }

  async function enviarResposta() {
    const texto = input.trim();
    if (!texto || enviando || concluida) return;

    setEnviando(true);
    adicionarMensagem(msgUser(texto));
    setInput("");

    // Guarda no Supabase via API route
    await guardarResposta(vaga.perguntas[indiceAtual].id, texto);

    const proximoIndice = indiceAtual + 1;

    if (proximoIndice < vaga.perguntas.length) {
      await botResponde(vaga.perguntas[proximoIndice].texto);
      setIndiceAtual(proximoIndice);
    } else {
      // Guardar candidacy quando a entrevista termina
      if (candidateEmail && candidatePhone) {
        await fetch("/api/candidatos/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: candidateEmail,
            telefone: candidatePhone,
            vaga_id: vaga.id,
            sessao_id: sessaoId,
          }),
        }).catch((err) => console.error("Erro ao criar candidatura:", err));
      }

      await botResponde(
        `Entrevista concluída! 🎉\n\nObrigado pela tua participação. As tuas respostas foram guardadas e serão analisadas pela nossa equipa em breve.\n\nBoa sorte! 🍀`,
      );
      setConcluida(true);
    }

    setEnviando(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarResposta();
    }
  }

  // Ajusta altura do textarea ao conteúdo
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const perguntasRespondidas = indiceAtual < 0 ? 0 : indiceAtual;
  const statusLabel =
    indiceAtual < 0
      ? "Pronto para começar"
      : concluida
        ? "Concluída ✓"
        : `Pergunta ${indiceAtual + 1} de ${vaga.perguntas.length}`;

  return (
    <div className="flex flex-col h-screen bg-[var(--c-bg)]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[var(--c-border)] px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2.5">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-700 text-sm transition-colors flex items-center gap-1"
            >
              ← Vagas
            </Link>
            <span className="text-gray-200">·</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold font-display">
                  D
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {vaga.titulo}
              </p>
            </div>
            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
              {statusLabel}
            </span>
          </div>
          <ProgressBar
            current={perguntasRespondidas}
            total={vaga.perguntas.length}
          />
        </div>
      </header>

      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {mensagens.map((msg) => (
            <MensagemItem key={msg.id} msg={msg} />
          ))}

          {mostrarTyping && (
            <div className="flex items-end gap-2 animate-fade-in">
              <BotAvatar />
              <div className="bubble-bot">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 bg-white border-t border-[var(--c-border)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {indiceAtual === -1 && !concluida ? (
            /* Botão inicial */
            <button
              onClick={comecar}
              className="btn-primary w-full py-3 text-sm"
            >
              Começar entrevista →
            </button>
          ) : concluida ? (
            /* Botão de fim */
            <div className="flex gap-3">
              <Link
                href="/"
                className="btn-ghost flex-1 py-3 text-sm text-center"
              >
                ← Ver outras vagas
              </Link>
            </div>
          ) : (
            /* Textarea de resposta */
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escreve a tua resposta… (Enter para enviar, Shift+Enter para nova linha)"
                disabled={enviando || mostrarTyping}
                className="input-base flex-1 resize-none min-h-[44px] max-h-[120px] py-3 leading-snug disabled:opacity-50"
                style={{ height: "44px" }}
              />
              <button
                onClick={enviarResposta}
                disabled={!input.trim() || enviando || mostrarTyping}
                className="btn-primary h-11 px-4 flex-shrink-0"
                aria-label="Enviar resposta"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                  />
                </svg>
              </button>
            </div>
          )}

          {indiceAtual >= 0 && !concluida && (
            <p className="text-center text-xs text-gray-300 mt-2">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
