import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { listPublishedInterviewsByCompany } from "@/lib/queries/interviews";
import GridPattern from "@/components/home/GridPattern";
import { Footer } from "@/components/home";

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
    alternates: {
      canonical: `/${company.slug}`,
    },
    openGraph: {
      title: `${company.name} - Entrevistas`,
      description,
      type: "website",
      url: `/${company.slug}`,
      images: company.logo_url
        ? [
            {
              url: company.logo_url,
              alt: `${company.name} logo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${company.name} - Entrevistas`,
      description,
      images: company.logo_url ? [company.logo_url] : undefined,
    },
  };
}

export default async function CompanyPublicPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || isCompanyInactive(company.subscription_status)) {
    notFound();
  }

  const interviews = await listPublishedInterviewsByCompany(company.id);

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <header className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href={`/${company.slug}`}
            className="group flex items-center gap-2.5"
            aria-label={`Pagina publica de ${company.name}`}
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`Logo ${company.name}`}
                className="h-9 w-9 rounded-[8px] object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--c-text)] text-[11px] font-bold text-white transition-transform duration-200 group-hover:scale-[1.06]">
                {company.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-[0.82rem] font-semibold tracking-tight text-[var(--c-text)]">
              {company.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#vagas"
              className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
            >
              Entrevistas
            </a>
            <a
              href="#como-funciona"
              className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
            >
              Como funciona
            </a>
            <Link
              href="/"
              className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
            >
              MatchWorky
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <GridPattern />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--c-bg)] to-transparent" />
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute right-1/4 top-1/3 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[var(--c-brand)]/[0.05] blur-[110px]" />
          <div className="absolute bottom-0 left-1/3 h-[280px] w-[280px] rounded-full bg-[var(--c-brand)]/[0.03] blur-[90px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 md:pb-28 md:pt-36">
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex animate-reveal items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--c-brand)] opacity-40 [animation-duration:1.2s]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--c-brand)]" />
              </span>
              <span className="text-[0.95rem] font-medium text-[var(--c-text)]/60">
                {interviews.length} vaga{interviews.length === 1 ? "" : "s"}{" "}
                aberta{interviews.length === 1 ? "" : "s"} · candidatura simples
              </span>
            </div>

            <h1
              className="animate-reveal text-balance font-display text-[2.8rem] leading-[1.05] tracking-[-0.035em] text-[var(--c-text)] md:text-[4.2rem]"
              style={{ animationDelay: "80ms" }}
            >
              Constrói o teu 
              futuro com a{" "}
              <br /> <span className="text-[var(--c-brand)]">{company.name}</span>
            </h1>

            <p
              className="mt-6 max-w-xl animate-reveal text-[1.05rem] leading-relaxed text-[var(--c-text)]/65"
              style={{ animationDelay: "160ms" }}
            >
              {company.description ||
                `Explora as vagas abertas da ${company.name}, responde ao teu ritmo e submete a candidatura em poucos minutos.`}
            </p>

            <div
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 animate-reveal"
              style={{ animationDelay: "240ms" }}
            >
              <a
                href="#vagas"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--c-brand)] px-5 py-[11px] text-[0.82rem] font-semibold text-white
                    shadow-[0_1px_2px_rgba(67,85,232,0.1),0_4px_16px_rgba(67,85,232,0.22)]
                    transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                    hover:-translate-y-[2px] hover:shadow-[0_2px_4px_rgba(67,85,232,0.1),0_8px_32px_rgba(67,85,232,0.28)]
                    active:scale-[0.985]"
              >
                Ver vagas disponíveis
              </a>

              <a
                href="#como-funciona"
                className="text-[0.82rem] font-medium text-[var(--c-text)]/55 transition-colors duration-150 hover:text-[var(--c-text)]"
              >
                Como funciona
              </a>
            </div>
          </div>
        </div>
      </section>
      <section id="vagas" className="mx-auto max-w-6xl px-6 pb-16 pt-14">
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
          <div className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--c-text)]">
              Neste momento nao existem entrevistas publicadas para esta
              empresa.
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
                className="group relative flex flex-col rounded-[14px] border border-[var(--c-border)]/80 bg-[var(--c-surface)] p-5 transition-[transform,box-shadow,border-color] duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[3px] hover:border-[var(--c-text)]/12 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-reveal"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-[14px] bg-gradient-to-r from-[var(--c-brand)]/70 via-[var(--c-brand)]/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-[var(--c-brand)]/20 bg-[var(--c-brand)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--c-brand)]">
                    Publicada
                  </span>
                  <span className="text-[11px] text-[var(--c-text)]/50">
                    {interview.questions.length} pergunta
                    {interview.questions.length === 1 ? "" : "s"}
                  </span>
                </div>

                <h3 className="text-[1.04rem] font-semibold leading-[1.35] tracking-[-0.015em] text-[var(--c-text)]">
                  {interview.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-[var(--c-text)]/60">
                  {interview.description ||
                    "Sem descricao para esta entrevista."}
                </p>

                <Link
                  href={`/${company.slug}/interview/${interview.id}`}
                  className="mt-5 inline-flex items-center justify-center rounded-md bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white transition-colors hover:bg-[var(--c-brand-dark)] active:scale-[0.985]"
                >
                  Candidatar-me agora
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        id="como-funciona"
        className="relative overflow-hidden border-y border-[var(--c-border)]/60 py-20 md:py-24"
      >
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.06]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-sm font-medium text-[var(--c-text)]/75">
              <span className="h-2 w-2 rounded-full bg-[var(--c-brand)]" />
              Processo simples e rapido
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-[var(--c-text)] sm:text-4xl">
              Como funciona
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--c-text)]/65 sm:text-lg">
              Escolhe a entrevista, responde ao teu ritmo e envia tudo em poucos
              minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: "Escolhe a entrevista",
                desc: "Ves as posicoes abertas desta empresa e escolhes a que encaixa melhor no teu perfil.",
                badge: "Passo 01",
                highlight: "Tudo centralizado num so sitio",
              },
              {
                title: "Responde em formato chat",
                desc: "A candidatura segue um fluxo conversacional para tornares o processo mais natural e direto.",
                badge: "Passo 02",
                highlight: "Experiencia simples e guiada",
              },
              {
                title: "Submete e acompanha",
                desc: "Depois de concluir, os dados ficam estruturados para a equipa de recrutamento analisar rapidamente.",
                badge: "Passo 03",
                highlight: "Envio rapido e claro",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-[var(--c-border)]/75 bg-[var(--c-surface)] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-brand)] text-white">
                    {item.badge.slice(-2)}
                  </span>
                  <span className="rounded-full border border-[var(--c-border)] px-3 py-1 text-xs font-semibold text-[var(--c-text)]/70">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[var(--c-text)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--c-text)]/62">
                  {item.desc}
                </p>

                <div
                  className="mt-5 h-px w-full bg-[var(--c-border)]/60"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm font-medium text-[var(--c-brand)]">
                  {item.highlight}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
