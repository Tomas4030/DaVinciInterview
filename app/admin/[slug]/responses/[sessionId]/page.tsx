import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { jsonParse, query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";

export const metadata: Metadata = { title: "Admin — Detalhe da Sessão" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string; sessionId: string };
};

type SessionRow = {
  id: string;
  sessao_id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  respostas: string | null;
  interview_title: string | null;
};

function getQuestionLabel(item: any, index: number): string {
  if (typeof item?.texto_pergunta === "string" && item.texto_pergunta.trim()) {
    return item.texto_pergunta;
  }
  if (typeof item?.question === "string" && item.question.trim()) {
    return item.question;
  }
  if (typeof item?.pergunta === "string" && item.pergunta.trim()) {
    return item.pergunta;
  }

  return `Pergunta ${index + 1}`;
}

function getAnswerText(item: any): string {
  if (typeof item?.resposta_texto === "string" && item.resposta_texto.trim()) {
    return item.resposta_texto;
  }
  if (typeof item?.resposta === "string" && item.resposta.trim()) {
    return item.resposta;
  }
  if (typeof item?.answer === "string" && item.answer.trim()) {
    return item.answer;
  }
  return "—";
}

export default async function AdminCompanyResponseDetailPage({ params }: Props) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);
  if (!session) {
    notFound();
  }

  const membership = await getCompanyMembershipBySlug(session.userId, params.slug);
  if (!membership) {
    notFound();
  }

  const [rows] = await query<SessionRow>(
    `
    SELECT
      cr.id,
      cr.sessao_id,
      cr.email,
      cr.telefone,
      cr.status,
      cr.criada_em AS created_at,
      cr.respostas,
      i.title AS interview_title
    FROM candidato_respostas cr
    LEFT JOIN interviews i ON i.id = cr.interview_id
    WHERE cr.company_id = ? AND cr.sessao_id = ?
    LIMIT 1
    `,
    [membership.company.id, params.sessionId],
  );

  const row = rows[0];
  if (!row) {
    notFound();
  }

  const answers = jsonParse<any[]>(row.respostas) || [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Sessão</p>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            {row.interview_title || "Entrevista"}
          </h1>
        </div>

        <Link
          href={`/admin/${params.slug}/responses`}
          className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
        >
          Voltar às respostas
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Candidato</p>
          <p className="mt-1 text-sm font-medium text-[var(--c-text)]">{row.email}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Telemóvel</p>
          <p className="mt-1 text-sm font-medium text-[var(--c-text)]">{row.telefone || "—"}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Estado</p>
          <p className="mt-1 text-sm font-medium text-[var(--c-text)]">{row.status}</p>
        </article>
        <article className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
          <p className="text-xs text-[var(--c-muted)]">Data/Hora</p>
          <p className="mt-1 text-sm font-medium text-[var(--c-text)]">
            {new Date(row.created_at).toLocaleString("pt-PT")}
          </p>
        </article>
      </div>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--c-text)]">Transcrição</h2>

        {answers.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--c-muted)]">Não existem respostas nesta sessão.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {answers.map((item, index) => (
              <article key={index} className="rounded-lg border border-[var(--c-border)]/60 bg-[var(--c-bg)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--c-muted)]">
                  {getQuestionLabel(item, index)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--c-text)]/90">
                  {getAnswerText(item)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
