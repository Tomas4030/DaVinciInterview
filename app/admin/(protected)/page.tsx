// app/admin/(protected)/page.tsx
import Link from "next/link";
import { listarVagas, contarRespostas } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Dashboard" };
export const dynamic = "force-dynamic";

/* ── status helpers ──────────────────────────────────────────── */
function statusBadge(ativa: boolean) {
  if (ativa) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100/80">
        <span className="h-1 w-1 rounded-full bg-emerald-500" />
        Ativa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-100/80">
      <span className="h-1 w-1 rounded-full bg-gray-400" />
      Inativa
    </span>
  );
}

function modalidadeDot(modalidade: string) {
  const color: Record<string, string> = {
    Remoto: "bg-sky-500",
    Híbrido: "bg-violet-500",
    Presencial: "bg-emerald-500",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${color[modalidade] ?? "bg-gray-400"}`} />;
}

/* ── stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="group rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5 transition-[border-color,box-shadow] duration-250 hover:border-[var(--c-brand)]/15 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.05em]">{label}</span>
        <span className="text-[var(--c-muted)]/40 transition-colors duration-200 group-hover:text-[var(--c-brand)]/40">{icon}</span>
      </div>
      <p className="text-[1.8rem] font-semibold text-[var(--c-text)] leading-none tabular-nums tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] text-[var(--c-muted)]">{sub}</p>
    </div>
  );
}

/* ── icons ───────────────────────────────────────────────────── */
function IconClipboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/* ── page ────────────────────────────────────────────────────── */
export default async function AdminPage() {
  let vagas: Awaited<ReturnType<typeof listarVagas>> = [];
  let totalRespostas = 0;

  try { vagas = await listarVagas(); } catch {}
  try { totalRespostas = await contarRespostas(); } catch {}

  const totalPerguntas = vagas.reduce((a, v) => a + v.total_perguntas, 0);
  const vagasAtivas = vagas.filter((v) => v.ativa).length;

  return (
    <div>
      {/* header */}
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="text-[1.35rem] font-semibold text-[var(--c-text)] tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[0.82rem] text-[var(--c-muted)]">Gere entrevistas e consulta candidaturas</p>
        </div>
        <Link
          href="/admin/entrevistas/nova"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--c-brand)] px-4 py-[9px] text-[0.78rem] font-semibold text-white shadow-[0_1px_2px_rgba(67,85,232,0.1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(67,85,232,0.22)] active:scale-[0.985]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova entrevista
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-8">
        <StatCard label="Entrevistas" value={vagas.length} sub={`${vagasAtivas} ativas`} icon={<IconClipboard />} />
        <StatCard label="Perguntas" value={totalPerguntas} sub="em todas as vagas" icon={<IconQuestion />} />
        <StatCard label="Respostas" value={totalRespostas.toLocaleString("pt-PT")} sub="candidaturas recebidas" icon={<IconMessage />} />
        <StatCard
          label="Média"
          value={vagas.length > 0 ? Math.round(totalRespostas / vagas.length) : "—"}
          sub="respostas por vaga"
          icon={<IconTrendingUp />}
        />
      </div>

      {/* entrevistas list */}
      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] overflow-hidden">
        {/* table header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-[0.82rem] font-semibold text-[var(--c-text)] tracking-tight">Entrevistas</h2>
          <span className="text-[11px] text-[var(--c-muted)]">
            {vagas.length} no total
          </span>
        </div>

        {vagas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.3 1.5-3.8 0-2.1-1.7-3.7-3.7-3.7-1.3 0-2.4.8-3 1.9" />
                <path d="M4 19l3.5-3.5" />
                <circle cx="20" cy="20" r="4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--c-text)]">Nenhuma entrevista criada.</p>
            <p className="mt-1 text-[0.78rem] text-[var(--c-muted)]">
              Cria a primeira para começar a receber candidaturas.
            </p>
            <Link href="/admin/entrevistas/nova" className="mt-4 text-[0.78rem] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Criar entrevista →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* column labels */}
            <div className="hidden px-5 py-2 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--c-muted)] md:flex items-center gap-4 bg-[var(--c-bg)]/40">
              <span className="flex-1">Título</span>
              <span className="w-24 text-center">Modalidade</span>
              <span className="w-20 text-right">Perguntas</span>
              <span className="w-8" />
            </div>

            {vagas.map((vaga, i) => (
              <div
                key={vaga.id}
                className="group/listitem animate-reveal px-5 py-4 flex items-center gap-4 hover:bg-[var(--c-bg)]/40 transition-colors duration-150"
                style={{ animationDelay: `${40 + i * 40}ms` }}
              >
                {/* info */}
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-2">
                  <div className="flex items-center gap-2">
                    {modalidadeDot(vaga.modalidade)}
                    <p className="text-[0.82rem] font-medium text-[var(--c-text)] truncate group-hover/listitem:text-[var(--c-brand)] transition-colors duration-150">{vaga.titulo}</p>
                  </div>
                  <span className="text-[10px] text-[var(--c-muted)] font-mono hidden md:block">{vaga.id}</span>
                  <span className="sm:hidden">{statusBadge(vaga.ativa)}</span>
                </div>

                {/* status — desktop */}
                <span className="hidden sm:block">{statusBadge(vaga.ativa)}</span>

                {/* perguntas */}
                <span className="text-[0.78rem] text-[var(--c-muted)] tabular-nums hidden md:block w-20 text-right">
                  {vaga.total_perguntas}
                </span>

                {/* action */}
                <Link
                  href={`/admin/entrevistas/${vaga.id}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition-[color,background-color] duration-150"
                  aria-label={`Editar ${vaga.titulo}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quick link to respostas */}
      {totalRespostas > 0 && (
        <div className="mt-5">
          <Link
            href="/admin/respostas"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-2.5 text-[0.78rem] font-medium text-[var(--c-text)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--c-brand)]/20 hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
          >
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            {totalRespostas.toLocaleString("pt-PT")} respostas pendentes →
          </Link>
        </div>
      )}
    </div>
  );
}
