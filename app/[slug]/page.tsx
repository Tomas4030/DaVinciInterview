import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { listPublishedInterviewsByCompany } from "@/lib/queries/interviews";
import GridPattern from "@/components/home/GridPattern";

type Props = {
  params: { slug: string };
};

function isCompanyInactive(subscriptionStatus: string): boolean {
  return subscriptionStatus === "canceled";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);

  if (!company || isCompanyInactive(company.subscription_status)) {
    return {
      title: "Empresa nao encontrada",
    };
  }

  const description =
    company.description || `Conhece as entrevistas abertas da ${company.name}.`;

  return {
    title: `${company.name} - Entrevistas`,
    description,
    openGraph: {
      title: `${company.name} - Entrevistas`,
      description,
      type: "website",
      images: company.logo_url
        ? [
            {
              url: company.logo_url,
              alt: `${company.name} logo`,
            },
          ]
        : undefined,
    },
  };
}

export default async function CompanyPublicPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || isCompanyInactive(company.subscription_status)) {
    notFound();
  }

  const interviews = await listPublishedInterviewsByCompany(company.id);
  const brandColor = company.primary_color || "var(--c-brand)";

  return (
    <main className="min-h-screen bg-[var(--c-bg)]" style={{ "--company-brand": brandColor } as CSSProperties}>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <GridPattern />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--c-bg)] to-transparent" />
          <div className="absolute right-1/4 top-1/3 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[var(--company-brand)]/10 blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-20 md:pb-20 md:pt-28">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex animate-reveal items-center gap-2 rounded-full border border-[var(--company-brand)]/25 bg-[var(--company-brand)]/10 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--company-brand)] opacity-45 [animation-duration:1.2s]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--company-brand)]" />
              </span>
              <span className="text-[12px] font-semibold text-[var(--company-brand)]">
                Entrevistas abertas de {company.name}
              </span>
            </div>

            <div className="mb-5 flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={`Logo ${company.name}`}
                  className="h-14 w-14 rounded-xl border border-[var(--c-border)]/60 object-cover bg-white"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-base font-semibold text-white"
                  style={{ backgroundColor: "var(--company-brand)" }}
                >
                  {company.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <h1 className="text-balance font-display text-[2.1rem] leading-[1.08] tracking-[-0.025em] text-[var(--c-text)] md:text-[3.2rem]">
                Junta-te a {company.name}
              </h1>
            </div>

            <p className="max-w-2xl text-[1rem] leading-relaxed text-[var(--c-text)]/65 md:text-[1.05rem]">
              {company.description ||
                "Consulta as oportunidades abertas, candidata-te em poucos minutos e acompanha o processo de forma simples."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-[0.84rem] text-[var(--c-text)]/60">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-3 py-1.5">
                {interviews.length} entrevista{interviews.length === 1 ? "" : "s"} publicada{interviews.length === 1 ? "" : "s"}
              </span>
              <Link href="/" className="font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]">
                Voltar ao site principal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="vagas" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[1.2rem] font-semibold tracking-tight text-[var(--c-text)]">
              Entrevistas abertas
            </h2>
            <p className="mt-1 text-[0.84rem] text-[var(--c-text)]/55">
              Escolhe uma posicao e inicia a candidatura.
            </p>
          </div>
        </div>

        {interviews.length === 0 ? (
          <div className="rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--c-text)]">
              Neste momento nao existem entrevistas publicadas para esta empresa.
            </p>
            <p className="mt-2 text-xs text-[var(--c-text)]/55">
              Volta mais tarde para veres novas oportunidades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview, index) => (
              <article
                key={interview.id}
                className="group relative flex flex-col rounded-[14px] border border-[var(--c-border)]/80 bg-[var(--c-surface)] p-5 transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[3px] hover:border-[var(--company-brand)]/25 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-reveal"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[14px] bg-gradient-to-r from-[var(--company-brand)]/70 via-[var(--company-brand)]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-[var(--company-brand)]/25 bg-[var(--company-brand)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--company-brand)]">
                    Publicada
                  </span>
                  <span className="text-[11px] text-[var(--c-text)]/50">
                    {interview.questions.length} pergunta{interview.questions.length === 1 ? "" : "s"}
                  </span>
                </div>

                <h3 className="text-[1.04rem] font-semibold leading-[1.35] tracking-[-0.015em] text-[var(--c-text)] transition-colors duration-200 group-hover:text-[var(--company-brand)]">
                  {interview.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-[var(--c-text)]/60">
                  {interview.description || "Sem descricao para esta entrevista."}
                </p>

                <Link
                  href={`/${company.slug}/interview/${interview.id}`}
                  className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2 text-[0.78rem] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(0,0,0,0.16)] active:scale-[0.985]"
                  style={{ backgroundColor: "var(--company-brand)" }}
                >
                  Candidatar-me agora
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
