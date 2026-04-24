import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { jsonParse, query } from "@/lib/db";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import type {
  ResponseAnswerItem,
  SessionRow,
} from "@/components/admin/responses";
import { QAPairsList, SessionSummaryCards } from "@/components/admin/responses";

export const metadata: Metadata = { title: "Admin — Detalhe da Sessão" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string; sessionId: string };
};

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

  const answers = jsonParse<ResponseAnswerItem[]>(row.respostas) || [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Sessão</p>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">
            {row.interview_title || "Entrevista"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/admin/${params.slug}/responses/${params.sessionId}/export`}
            className="btn-primary inline-flex px-4 py-2 text-sm"
          >
            Exportar CSV
          </a>
          <Link
            href={`/admin/${params.slug}/responses`}
            className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg)]"
          >
            Voltar às respostas
          </Link>
        </div>
      </header>

      <SessionSummaryCards
        email={row.email}
        telefone={row.telefone}
        status={row.status}
        createdAt={row.created_at}
      />

      <QAPairsList answers={answers} />
    </section>
  );
}
