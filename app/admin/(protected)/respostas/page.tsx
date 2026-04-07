// app/admin/(protected)/respostas/page.tsx
import { listarSessoes, obterVaga, listarVagas } from "@/lib/api";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Respostas" };

interface Props {
  searchParams: { vaga?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── chevron icon for details ────────────────────────────────── */
function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[var(--c-muted)]/40 group-open:rotate-180 transition-transform duration-200"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default async function RespostasPage({ searchParams }: Props) {
  const vagaFiltro = searchParams.vaga;

  let sessoes: Awaited<ReturnType<typeof listarSessoes>> = [];
  let vaga = vagaFiltro ? await obterVaga(vagaFiltro).catch(() => null) : null;
  let todasVagas: Awaited<ReturnType<typeof listarVagas>> = [];

  try { sessoes = await listarSessoes(vagaFiltro); } catch {}
  try { todasVagas = await listarVagas(); } catch {}

  return (
    <div>
      {/* header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-[1.35rem] font-semibold text-[var(--c-text)] tracking-tight">
            Respostas {vaga && <span className="text-[var(--c-muted)] font-normal">— {vaga.titulo}</span>}
          </h1>
          <p className="mt-1 text-[0.82rem] text-[var(--c-muted)]">
            {sessoes.length} sess{sessoes.length === 1 ? "ão" : "ões"} encontrad{sessoes.length === 1 ? "a" : "as"}
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-border)]/80 bg-[var(--c-surface)] px-3 py-1.5 text-[0.72rem] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] hover:border-[var(--c-border)] transition-[color,border-color] duration-200"
        >
          ← Dashboard
        </Link>
      </div>

      {/* filter chips */}
      {todasVagas.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-[var(--c-muted)]">Filtrar:</span>
          <Link
            href="/admin/respostas"
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-all duration-150 ${
              !vagaFiltro
                ? "bg-[var(--c-brand)] text-white ring-[var(--c-brand)]"
                : "bg-[var(--c-surface)] text-[var(--c-muted)] ring-[var(--c-border)] hover:text-[var(--c-text)] hover:ring-[var(--c-border)]"
            }`}
          >
            Todas
          </Link>
          {todasVagas.map((v) => (
            <Link
              key={v.id}
              href={`/admin/respostas?vaga=${v.id}`}
              className={`max-w-[200px] truncate rounded-lg px-3 py-1.5 text-[11px] font-medium ring-1 transition-all duration-150 ${
                vagaFiltro === v.id
                  ? "bg-[var(--c-brand)] text-white ring-[var(--c-brand)]"
                  : "bg-[var(--c-surface)] text-[var(--c-muted)] ring-[var(--c-border)] hover:text-[var(--c-text)] hover:ring-[var(--c-border)]"
              }`}
            >
              {v.titulo}
            </Link>
          ))}
        </div>
      )}

      {/* sessions list */}
      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] py-20 px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--c-text)]">Nenhuma resposta recebida ainda.</p>
          <p className="mt-1.5 text-[0.78rem] text-[var(--c-muted)]">
            As respostas dos candidatos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessoes.map((sessao, i) => {
            const vagaSessao = todasVagas.find((v) => v.id === sessao.vaga_id);

            return (
              <details
                key={sessao.sessao_id}
                className="group/card rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] overflow-hidden animate-reveal transition-[border-color,box-shadow] duration-200 hover:border-[var(--c-border)]"
                open={i === 0}
                style={{ animationDelay: `${50 + i * 40}ms` }}
              >
                <summary className="flex cursor-pointer items-center gap-3 px-5 py-3.5 list-none hover:bg-[var(--c-bg)]/30 transition-colors duration-150">
                  {/* index badge */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--c-bg)] text-[10px] font-semibold text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60 tabular-nums transition-colors duration-150 group-open/card:bg-[var(--c-brand)]/10 group-open/card:text-[var(--c-brand)]">
                    {i + 1}
                  </span>

                  {/* title + session id */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.82rem] font-medium text-[var(--c-text)] truncate">
                      {vagaSessao?.titulo ?? "Vaga removida"}
                    </p>
                    <p className="text-[10px] text-[var(--c-muted)]/60 font-mono truncate">
                      {sessao.sessao_id}
                    </p>
                  </div>

                  {/* meta */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[11px] text-[var(--c-muted)]">{formatDate(sessao.criada_em)}</p>
                    <p className="text-[10px] text-[var(--c-muted)]/50 mt-0.5">
                      {sessao.respostas.length} {sessao.respostas.length === 1 ? "resposta" : "respostas"}
                    </p>
                  </div>

                  <ChevronIcon />
                </summary>

                {/* responses */}
                <div className="border-t border-gray-50 divide-y divide-gray-50/80">
                  {sessao.respostas
                    .sort((a, b) => a.pergunta_id - b.pergunta_id)
                    .map((resp) => {
                      const pergunta =
                        (vaga?.perguntas ?? []).find(
                          (p) => p.id === resp.pergunta_id,
                        );

                      return (
                        <div key={resp.id} className="px-5 py-4">
                          <p className="mb-2 flex items-center gap-2">
                            <span className="rounded-md bg-[var(--c-bg)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60">
                              Q{resp.pergunta_id}
                            </span>
                            {pergunta?.texto && (
                              <span className="text-[0.72rem] font-medium text-[var(--c-text)]/60 truncate">{pergunta.texto}</span>
                            )}
                          </p>
                          <p className="text-[0.82rem] text-[var(--c-text)]/80 leading-relaxed whitespace-pre-wrap pl-1">
                            {resp.resposta}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
