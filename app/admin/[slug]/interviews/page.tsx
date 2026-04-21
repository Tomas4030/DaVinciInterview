import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listInterviewsByCompany } from "@/lib/queries/interviews";

export const metadata: Metadata = { title: "Admin — Entrevistas" };
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
  searchParams?: {
    q?: string;
    status?: string;
  };
};

const STATUS_OPTIONS = ["all", "draft", "published", "archived"] as const;

export default async function AdminCompanyInterviewsPage({
  params,
  searchParams,
}: Props) {
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

  const searchTerm = String(searchParams?.q || "").trim().toLowerCase();
  const rawStatus = String(searchParams?.status || "all").toLowerCase();
  const statusFilter = STATUS_OPTIONS.includes(rawStatus as (typeof STATUS_OPTIONS)[number])
    ? rawStatus
    : "all";

  const interviews = await listInterviewsByCompany(membership.company.id);
  const filteredInterviews = interviews.filter((item) => {
    const statusMatches = statusFilter === "all" || item.status === statusFilter;
    if (!statusMatches) return false;

    if (!searchTerm) return true;
    return (
      item.title.toLowerCase().includes(searchTerm) ||
      String(item.description || "").toLowerCase().includes(searchTerm)
    );
  });

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.09em] text-[var(--c-muted)]">Entrevistas</p>
          <h1 className="text-2xl font-semibold text-[var(--c-text)]">Gestao de entrevistas</h1>
        </div>

        <Link href="/admin/entrevistas/nova" className="btn-primary inline-flex px-4 py-2">
          Nova entrevista (legado)
        </Link>
      </header>

      <form className="grid gap-3 rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4 md:grid-cols-[1fr,170px,auto]">
        <input
          type="text"
          name="q"
          defaultValue={searchTerm}
          placeholder="Pesquisar por titulo ou descricao"
          className="input-base"
        />

        <select name="status" defaultValue={statusFilter} className="input-base">
          <option value="all">Todos os estados</option>
          <option value="draft">Rascunho</option>
          <option value="published">Publicada</option>
          <option value="archived">Arquivada</option>
        </select>

        <button type="submit" className="btn-primary inline-flex justify-center px-4 py-2">
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--c-border)]/60 px-5 py-3">
          <p className="text-sm font-medium text-[var(--c-text)]">Resultados</p>
          <p className="text-xs text-[var(--c-muted)]">{filteredInterviews.length} entrevistas</p>
        </div>

        {filteredInterviews.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--c-muted)]">
            Sem resultados para os filtros selecionados.
          </p>
        ) : (
          <div className="divide-y divide-[var(--c-border)]/50">
            {filteredInterviews.map((item) => (
              <article key={item.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[var(--c-text)]">{item.title}</h2>
                  <span className="rounded-full border border-[var(--c-border)] px-2.5 py-1 text-[11px] text-[var(--c-muted)]">
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-[var(--c-muted)]">
                  {item.description || "Sem descricao."}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--c-muted)]">
                  <span>
                    {item.questions.length} pergunta{item.questions.length === 1 ? "" : "s"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/${params.slug}/responses?interviewId=${item.id}`}
                      className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 transition-colors hover:bg-[var(--c-bg)]"
                    >
                      Ver respostas
                    </Link>

                    {item.legacy_vaga_id ? (
                      <Link
                        href={`/admin/entrevistas/${item.legacy_vaga_id}`}
                        className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 transition-colors hover:bg-[var(--c-bg)]"
                      >
                        Editar (legado)
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
