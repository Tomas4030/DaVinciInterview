import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { listPublishedInterviewsByCompany } from "@/lib/queries/interviews";

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

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <section className="mx-auto max-w-5xl px-6 pb-10 pt-16">
        <div className="rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-6 md:p-8">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`Logo ${company.name}`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--c-brand)] text-sm font-semibold text-white">
                {company.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-[var(--c-text)]">{company.name}</h1>
              <p className="text-sm text-[var(--c-text)]/65">{company.description || "Sem descricao."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-lg font-semibold text-[var(--c-text)]">Entrevistas abertas</h2>
        {interviews.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--c-text)]/65">
            Neste momento nao existem entrevistas publicadas para esta empresa.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {interviews.map((interview) => (
              <article
                key={interview.id}
                className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-5"
              >
                <h3 className="text-base font-semibold text-[var(--c-text)]">{interview.title}</h3>
                <p className="mt-1 text-sm text-[var(--c-text)]/65">
                  {interview.description || "Sem descricao para esta vaga."}
                </p>

                <Link
                  href={`/${company.slug}/interview/${interview.id}`}
                  className="mt-4 inline-flex rounded-lg bg-[var(--c-brand)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Candidatar-me
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
