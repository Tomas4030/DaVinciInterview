// app/admin/(protected)/respostas/page.tsx
import { listarSessoes, obterVaga, listarVagas } from "@/lib/api";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Respostas" };

interface Props {
  searchParams: { vaga?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[var(--c-muted)]/70 transition-transform duration-200 group-open/card:rotate-180"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MailIcon() {
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
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" opacity="0" />
      <path d="M4 6h16v12H4z" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}

function PhoneIcon() {
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
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.23a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function looksLikeEmail(value?: string | null) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikePhone(value?: string | null) {
  if (!value) return false;
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned.length >= 9;
}

function getSessionEmail(sessao: any) {
  if (looksLikeEmail(sessao?.email)) return sessao.email;

  const byQuestion = sessao?.respostas?.find((resp: any) => {
    const question = normalizeText(resp?.texto_pergunta);
    return (
      question.includes("email") ||
      question.includes("e-mail") ||
      looksLikeEmail(resp?.resposta)
    );
  });

  return byQuestion?.resposta ?? null;
}

function getSessionPhone(sessao: any) {
  if (looksLikePhone(sessao?.telefone)) return sessao.telefone;
  if (looksLikePhone(sessao?.telemovel)) return sessao.telemovel;
  if (looksLikePhone(sessao?.telemóvel)) return sessao.telemóvel;

  const byQuestion = sessao?.respostas?.find((resp: any) => {
    const question = normalizeText(resp?.texto_pergunta);
    return (
      question.includes("telefone") ||
      question.includes("telemovel") ||
      question.includes("telemóvel") ||
      question.includes("celular") ||
      looksLikePhone(resp?.resposta)
    );
  });

  return byQuestion?.resposta ?? null;
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-4 py-3 shadow-sm">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--c-bg)] text-[var(--c-brand)]">
        {icon}
      </div>
      <p className="text-xs text-[var(--c-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--c-text)]">
        {value}
      </p>
    </div>
  );
}

function ContactBadge({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const content = (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--c-border)]/70 bg-[var(--c-bg)] px-3 py-1.5 text-xs font-medium text-[var(--c-text)]">
      <span className="text-[var(--c-muted)]">{icon}</span>
      <span className="truncate">{value}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} className="max-w-full hover:opacity-85 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}

export default async function RespostasPage({ searchParams }: Props) {
  const vagaFiltro = searchParams.vaga;

  let sessoes: Awaited<ReturnType<typeof listarSessoes>> = [];
  let vaga = vagaFiltro ? await obterVaga(vagaFiltro).catch(() => null) : null;
  let todasVagas: Awaited<ReturnType<typeof listarVagas>> = [];

  try {
    sessoes = await listarSessoes(vagaFiltro);
  } catch (error) {
    console.error("ERRO AO LISTAR SESSOES:", error);
  }

  try {
    todasVagas = await listarVagas();
  } catch {}

  const totalRespostas = sessoes.reduce(
    (acc, sessao) => acc + (sessao.respostas?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--c-text)]">
            Respostas
            {vaga && (
              <span className="ml-2 text-base font-normal text-[var(--c-muted)]">
                — {vaga.titulo}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-[var(--c-muted)]">
            Gestão das respostas enviadas pelos candidatos.
          </p>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Sessões"
          value={sessoes.length}
          icon={<FileTextIcon />}
        />
        <StatCard
          label="Respostas totais"
          value={totalRespostas}
          icon={<FileTextIcon />}
        />
        <StatCard
          label="Filtro ativo"
          value={vaga?.titulo ?? "Todas as vagas"}
          icon={<FileTextIcon />}
        />
      </div>

      {/* filters */}
      {todasVagas.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] font-medium text-[var(--c-muted)]">
              Filtrar:
            </span>

            <Link
              href="/admin/respostas"
              className={`inline-flex max-w-[180px] items-center truncate rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                !vagaFiltro
                  ? "bg-[var(--c-brand)] text-white"
                  : "bg-[var(--c-surface)] text-[var(--c-muted)] ring-1 ring-[var(--c-border)] hover:text-[var(--c-text)]"
              }`}
            >
              Todas
            </Link>

            {todasVagas.map((v) => (
              <Link
                key={v.id}
                href={`/admin/respostas?vaga=${v.id}`}
                className={`inline-flex max-w-[180px] items-center truncate rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  vagaFiltro === v.id
                    ? "bg-[var(--c-brand)] text-white"
                    : "bg-[var(--c-surface)] text-[var(--c-muted)] ring-1 ring-[var(--c-border)] hover:text-[var(--c-text)]"
                }`}
                title={v.titulo}
              >
                {v.titulo}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* empty state */}
      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] px-6 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--c-bg)] text-[var(--c-brand)]">
            <FileTextIcon />
          </div>
          <p className="text-base font-semibold text-[var(--c-text)]">
            Nenhuma resposta encontrada
          </p>
          <p className="mt-1 max-w-md text-sm text-[var(--c-muted)]">
            Quando os candidatos responderem ao formulário, as sessões vão
            aparecer aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessoes.map((sessao, i) => {
            const vagaSessao = todasVagas.find((v) => v.id === sessao.vaga_id);
            const email = getSessionEmail(sessao);
            const telefone = getSessionPhone(sessao);

            return (
              <details
                key={sessao.sessao_id}
                className="group/card overflow-hidden rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] shadow-sm transition hover:border-[var(--c-border)]"
                open={i === 0}
              >
                <summary className="list-none cursor-pointer">
                  <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--c-bg)] text-sm font-semibold text-[var(--c-brand)] ring-1 ring-[var(--c-border)]/60">
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[var(--c-text)]">
                              {vagaSessao?.titulo ?? "Vaga removida"}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {email && (
                                <ContactBadge
                                  icon={<MailIcon />}
                                  value={email}
                                  href={`mailto:${email}`}
                                />
                              )}

                              {telefone && (
                                <ContactBadge
                                  icon={<PhoneIcon />}
                                  value={telefone}
                                  href={`tel:${telefone}`}
                                />
                              )}

                              {!email && !telefone && (
                                <span className="inline-flex items-center rounded-full border border-[var(--c-border)]/70 bg-[var(--c-bg)] px-3 py-1.5 text-xs text-[var(--c-muted)]">
                                  Sem contacto identificado
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-start gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-[var(--c-text)]">
                                {formatDate(sessao.criada_em)}
                              </p>
                              <p className="mt-1 text-xs text-[var(--c-muted)]">
                                {sessao.respostas.length}{" "}
                                {sessao.respostas.length === 1
                                  ? "resposta"
                                  : "respostas"}
                              </p>
                            </div>

                            <div className="mt-1">
                              <ChevronIcon />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-[var(--c-muted)]">
                            Sessão:
                            <span className="ml-1 font-mono text-[var(--c-muted)]/80">
                              {sessao.sessao_id}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-[var(--c-border)]/60 bg-[var(--c-bg)]/25">
                  {sessao.respostas
                    .sort((a, b) => a.pergunta_id - b.pergunta_id)
                    .map((resp) => (
                      <div
                        key={resp.id}
                        className="border-b border-[var(--c-border)]/50 px-5 py-4 last:border-b-0 sm:px-6"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[var(--c-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--c-brand)] ring-1 ring-[var(--c-border)]/60">
                            Q{resp.pergunta_id}
                          </span>

                          {resp.texto_pergunta && (
                            <p className="text-sm font-medium text-[var(--c-text)]">
                              {resp.texto_pergunta}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-[var(--c-border)]/50 bg-[var(--c-surface)] px-4 py-3">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--c-text)]/88">
                            {resp.resposta || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
