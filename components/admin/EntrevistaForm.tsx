"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vaga } from "@/lib/api";
import { withBasePath } from "@/lib/base-path";

interface Props {
  vagaInicial?: Vaga;
}

const VAGA_VAZIA: Vaga = {
  id: "",
  titulo: "",
  descricao: "",
  modalidade: "Remoto",
  duracao_min: 10,
  perguntas: [{ id: 1, texto: "", tipo: "aberta" }],
  ativa: true,
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--c-muted)] mb-1.5">
      {children}
    </label>
  );
}

export default function EntrevistaForm({ vagaInicial }: Props) {
  const router = useRouter();
  const isEdicao = !!vagaInicial;

  const [vaga, setVaga] = useState<Vaga>(vagaInicial ?? VAGA_VAZIA);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmApagar, setConfirmApagar] = useState(false);
  const [saved, setSaved] = useState(false);

  function setCampo<K extends keyof Vaga>(campo: K, valor: Vaga[K]) {
    setVaga((prev) => ({ ...prev, [campo]: valor }));
    setSaved(false);
  }

  function adicionarPergunta() {
    const novoId = vaga.perguntas.length + 1;
    setVaga((prev) => ({
      ...prev,
      perguntas: [...prev.perguntas, { id: novoId, texto: "", tipo: "aberta" }],
    }));
  }

  function removerPergunta(index: number) {
    setVaga((prev) => ({
      ...prev,
      perguntas: prev.perguntas
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, id: i + 1 })),
    }));
  }

  function moverPergunta(index: number, direcao: "up" | "down") {
    const arr = [...vaga.perguntas];
    const destino = direcao === "up" ? index - 1 : index + 1;
    if (destino < 0 || destino >= arr.length) return;
    [arr[index], arr[destino]] = [arr[destino], arr[index]];
    setVaga((prev) => ({
      ...prev,
      perguntas: arr.map((p, i) => ({ ...p, id: i + 1 })),
    }));
  }

  function atualizarPergunta(index: number, texto: string) {
    setVaga((prev) => ({
      ...prev,
      perguntas: prev.perguntas.map((p, i) =>
        i === index ? { ...p, texto } : p,
      ),
    }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!vaga.id.trim()) return setErro("O ID da vaga é obrigatório.");
    if (!vaga.titulo.trim()) return setErro("O título é obrigatório.");
    if (vaga.perguntas.some((p) => !p.texto.trim()))
      return setErro("Todas as perguntas devem ter texto.");
    if (!/^[a-z0-9-]+$/.test(vaga.id))
      return setErro("O ID só pode ter letras minúsculas, números e hífenes.");

    setLoading(true);
    try {
      const url = isEdicao
        ? withBasePath(`/api/vagas/${vaga.id}`)
        : withBasePath("/api/vagas");
      const method = isEdicao ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vaga),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao guardar");
      }

      setSaved(true);
      setTimeout(() => router.push("/admin"), 800);
      router.refresh();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function handleApagar() {
    if (!confirmApagar) {
      setConfirmApagar(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(withBasePath(`/api/vagas/${vaga.id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao apagar");
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao apagar");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* ── Alertas ── */}
      {erro && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5 text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-600">{erro}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <p className="text-sm text-emerald-700">
            Guardado com sucesso. A voltar…
          </p>
        </div>
      )}

      {/* ── Informação básica ── */}
      <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--c-border)]/40 bg-[var(--c-bg)]/40">
          <h2 className="text-[0.8rem] font-semibold text-[var(--c-text)]">
            Informação básica
          </h2>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ID */}
            <div>
              <FieldLabel>
                ID da vaga{" "}
                <span className="text-red-400 normal-case font-normal">*</span>
              </FieldLabel>
              <input
                value={vaga.id}
                onChange={(e) =>
                  setCampo(
                    "id",
                    e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  )
                }
                disabled={isEdicao}
                placeholder="ex: fullstack-senior"
                className="input-base font-mono disabled:bg-[var(--c-bg)] disabled:text-[var(--c-muted)] disabled:cursor-not-allowed"
              />
              <p className="mt-1.5 text-[10px] text-[var(--c-muted)]">
                Letras minúsculas, números e hífenes
              </p>
            </div>

            {/* Título */}
            <div>
              <FieldLabel>
                Título{" "}
                <span className="text-red-400 normal-case font-normal">*</span>
              </FieldLabel>
              <input
                value={vaga.titulo}
                onChange={(e) => setCampo("titulo", e.target.value)}
                placeholder="ex: Programador Full-Stack"
                className="input-base"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <textarea
              value={vaga.descricao}
              onChange={(e) => setCampo("descricao", e.target.value)}
              rows={2}
              placeholder="Breve descrição da vaga…"
              className="input-base resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel>Modalidade</FieldLabel>
              <select
                value={vaga.modalidade}
                onChange={(e) => setCampo("modalidade", e.target.value)}
                className="input-base"
              >
                <option>Remoto</option>
                <option>Híbrido</option>
                <option>Presencial</option>
              </select>
            </div>

            <div>
              <FieldLabel>Duração (min)</FieldLabel>
              <input
                type="number"
                min={1}
                max={120}
                value={vaga.duracao_min}
                onChange={(e) =>
                  setCampo("duracao_min", Number(e.target.value))
                }
                className="input-base"
              />
            </div>

            <div>
              <FieldLabel>Estado</FieldLabel>
              <select
                value={vaga.ativa ? "ativa" : "inativa"}
                onChange={(e) => setCampo("ativa", e.target.value === "ativa")}
                className="input-base"
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Perguntas ── */}
      <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)]/40 bg-[var(--c-bg)]/40">
          <h2 className="text-[0.8rem] font-semibold text-[var(--c-text)]">
            Perguntas
            <span className="ml-2 font-normal text-[var(--c-muted)] text-[11px]">
              {vaga.perguntas.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={adicionarPergunta}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--c-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] ring-1 ring-[var(--c-border)]/60 hover:ring-[var(--c-border)] transition-all duration-150"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {vaga.perguntas.map((pergunta, i) => (
            <div
              key={i}
              className="group/pergunta flex items-start gap-3 animate-reveal"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              {/* number */}
              <span className="mt-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--c-bg)] text-[9px] font-bold text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60 tabular-nums select-none">
                {i + 1}
              </span>

              {/* textarea */}
              <textarea
                value={pergunta.texto}
                onChange={(e) => atualizarPergunta(i, e.target.value)}
                rows={2}
                placeholder={`Pergunta ${i + 1}…`}
                className="input-base flex-1 resize-none"
              />

              {/* controls */}
              <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover/pergunta:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => moverPergunta(i, "up")}
                  disabled={i === 0}
                  title="Mover para cima"
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] disabled:opacity-0 transition-colors text-[10px]"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverPergunta(i, "down")}
                  disabled={i === vaga.perguntas.length - 1}
                  title="Mover para baixo"
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] disabled:opacity-0 transition-colors text-[10px]"
                >
                  ↓
                </button>
                {vaga.perguntas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerPergunta(i)}
                    title="Remover"
                    className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-red-500 hover:bg-red-50 transition-colors text-[11px]"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Acções ── */}
      <div className="flex items-center justify-between gap-4 pt-1 pb-4">
        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={loading}
            className={`
              inline-flex items-center gap-2 rounded-xl px-4 py-[9px] text-[0.78rem] font-semibold text-white
              transition-[transform,box-shadow,background-color] duration-200
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]
              ${
                saved
                  ? "bg-emerald-600"
                  : "bg-[var(--c-brand)] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(67,85,232,0.22)]"
              }
            `}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                A guardar…
              </>
            ) : saved ? (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Guardado!
              </>
            ) : isEdicao ? (
              "Guardar alterações"
            ) : (
              "Criar entrevista"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-xl border border-[var(--c-border)]/80 px-4 py-[9px] text-[0.78rem] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] hover:border-[var(--c-border)] transition-colors duration-150"
          >
            Cancelar
          </button>
        </div>

        {isEdicao && (
          <button
            type="button"
            onClick={handleApagar}
            disabled={loading}
            className={`text-[0.72rem] font-medium rounded-xl border px-4 py-[9px] transition-all duration-200 ${
              confirmApagar
                ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                : "text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200"
            }`}
          >
            {confirmApagar ? "Confirmar eliminação" : "Eliminar vaga"}
          </button>
        )}
      </div>
    </form>
  );
}
