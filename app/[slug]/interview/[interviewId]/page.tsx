import { redirect, notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";

type Props = {
  params: { slug: string; interviewId: string };
};

export default async function InterviewEntryPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    notFound();
  }

  const interview = await getInterviewById(params.interviewId);
  if (!interview || interview.company_id !== company.id || interview.status !== "published") {
    notFound();
  }

  if (interview.legacy_vaga_id) {
    redirect(`/entrevista/${interview.legacy_vaga_id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-[var(--c-text)]">{interview.title}</h1>
      <p className="mt-3 text-sm text-[var(--c-text)]/65">
        O novo fluxo de verificacao desta entrevista sera ativado na Fase 5.
      </p>
    </main>
  );
}
