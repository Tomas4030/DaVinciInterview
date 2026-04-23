import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";

type Props = {
  params: { slug: string; interviewId: string };
};

export default async function InterviewDonePage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    notFound();
  }

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-[var(--c-text)]">Obrigado!</h1>
      <p className="mt-3 text-sm text-[var(--c-text)]/65">
        Recebemos as tuas respostas para a entrevista <strong>{interview.title}</strong>.
      </p>
      <p className="mt-2 text-sm text-[var(--c-text)]/65">
        A equipa da {company.name} vai analisar o teu perfil e entrar em contacto com os próximos passos.
      </p>

      <div className="mt-8">
        <Link
          href={`/${company.slug}`}
          className="inline-flex rounded-lg bg-[var(--c-brand)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Voltar à página da empresa
        </Link>
      </div>
    </main>
  );
}
