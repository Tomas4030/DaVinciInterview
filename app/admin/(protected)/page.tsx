// app/admin/(protected)/page.tsx
import Link from "next/link";
import { listarVagas, contarRespostas } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Dashboard" };
export const dynamic = "force-dynamic";

/* ── helpers ─────────────────────────────────────────────────── */
function statusBadge(ativa: boolean) {
  if (ativa) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        <span className="h-1 w-1 rounded-full bg-emerald-500" />
        Ativa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400 ring-1 ring-gray-100">
      <span className="h-1 w-1 rounded-full bg-gray-300" />
      Inativa
    </span>
  );
}

const MODALIDADE_COLORS: Record<string, string> = {
  Remoto: "bg-sky-400",
  Híbrido: "bg-violet-400",
  Presencial: "bg-emerald-400",
};

/* ── stat card ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--c-muted)] mb-3">
        {label}
      </p>
      <p className="text-[2rem] font-semibold text-[var(--c-text)] leading-none tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-[11px] text-[var(--c-muted)]/70">{sub}</p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */
export default async function AdminPage() {
  let vagas: Awaited<ReturnType<typeof listarVagas>> = [];
  let totalRespostas = 0;

  try {
    vagas = await listarVagas();
  } catch {}
  try {
    totalRespostas = await contarRespostas();
  } catch {}

  const totalPerguntas = vagas.reduce((a, v) => a + v.total_perguntas, 0);
  const vagasAtivas = vagas.filter((v) => v.ativa).length;

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--c-text)] tracking-tight">
            Dashboardddddddddd
          </h1>
          <p className="mt-0.5 text-[0.8rem] text-[var(--c-muted)]">
            Gere entrevistas e consulta candidaturas
          </p>
        </div>
        <Link
          href="/admin/entrevistas/nova"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white shadow-[0_1px_2px_rgba(67,85,232,0.1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(67,85,232,0.22)] active:scale-[0.985]"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova entrevista
        </Link>
      </div>

      {/* ── stats ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Entrevistas"
          value={vagas.length}
          sub={`${vagasAtivas} ativa${vagasAtivas !== 1 ? "s" : ""}`}
        />
        <StatCard
          label="Perguntas"
          value={totalPerguntas}
          sub="em todas as vagas"
        />
        <StatCard
          label="Respostas"
          value={totalRespostas.toLocaleString("pt-PT")}
          sub="candidaturas recebidas"
        />
        <StatCard
          label="Média"
          value={
            vagas.length > 0 ? Math.round(totalRespostas / vagas.length) : "—"
          }
          sub="respostas por vaga"
        />
      </div>

      {/* ── entrevistas ── */}
      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] overflow-hidden">
        {/* table header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)]/50">
          <h2 className="text-[0.82rem] font-semibold text-[var(--c-text)]">
            Entrevistas
          </h2>
          <span className="text-[11px] text-[var(--c-muted)]">
            {vagas.length} no total
          </span>
        </div>

        {vagas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--c-bg)] text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--c-text)]">
              Nenhuma entrevista criada.
            </p>
            <p className="mt-1 text-[0.78rem] text-[var(--c-muted)]">
              Cria a primeira para começar a receber candidaturas.
            </p>
            <Link
              href="/admin/entrevistas/nova"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--c-brand)] px-3.5 py-2 text-[0.75rem] font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            >
              Criar entrevista
            </Link>
          </div>
        ) : (
          <>
            {/* col headers */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_36px] gap-4 items-center px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--c-muted)] bg-[var(--c-bg)]/50 border-b border-[var(--c-border)]/30">
              <span>Título</span>
              <span className="w-20 text-center">Modalidade</span>
              <span className="w-14 text-center">Estado</span>
              <span className="w-16 text-right">Perguntas</span>
              <span />
            </div>

            <div className="divide-y divide-[var(--c-border)]/30">
              {vagas.map((vaga, i) => (
                <div
                  key={vaga.id}
                  className="group/row animate-reveal grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto_36px] gap-4 items-center px-5 py-3.5 hover:bg-[var(--c-bg)]/40 transition-colors duration-150"
                  style={{ animationDelay: `${40 + i * 35}ms` }}
                >
                  {/* title + slug */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${MODALIDADE_COLORS[vaga.modalidade] ?? "bg-gray-400"}`}
                      />
                      <p className="text-[0.82rem] font-medium text-[var(--c-text)] truncate group-hover/row:text-[var(--c-brand)] transition-colors duration-150">
                        {vaga.titulo}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--c-muted)]/50 font-mono pl-3.5 truncate">
                      {vaga.id}
                    </p>
                  </div>

                  {/* mobile: estado */}
                  <div className="flex items-center gap-2 md:hidden">
                    {statusBadge(vaga.ativa)}
                    <Link
                      href={`/admin/entrevistas/${vaga.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition-colors duration-150"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </Link>
                  </div>

                  {/* desktop: modalidade */}
                  <span className="hidden md:flex w-20 justify-center text-[11px] text-[var(--c-muted)]">
                    {vaga.modalidade}
                  </span>

                  {/* desktop: estado */}
                  <div className="hidden md:flex w-14 justify-center">
                    {statusBadge(vaga.ativa)}
                  </div>

                  {/* desktop: perguntas */}
                  <span className="hidden md:block w-16 text-right text-[0.78rem] tabular-nums text-[var(--c-muted)]">
                    {vaga.total_perguntas}
                  </span>

                  {/* desktop: action */}
                  <Link
                    href={`/admin/entrevistas/${vaga.id}`}
                    className="hidden md:flex h-8 w-9 items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition-colors duration-150"
                    aria-label={`Editar ${vaga.titulo}`}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── quick link ── */}
      {totalRespostas > 0 && (
        <Link
          href="/admin/respostas"
          className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-2.5 text-[0.78rem] font-medium text-[var(--c-text)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--c-brand)]/20 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--c-brand)] animate-pulse" />
          {totalRespostas.toLocaleString("pt-PT")} respostas recebidas
          <span className="text-[var(--c-muted)]">→</span>
        </Link>
      )}
    </div>
  );
}
