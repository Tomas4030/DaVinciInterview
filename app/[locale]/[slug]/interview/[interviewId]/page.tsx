import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import InterviewVerificationForm from "@/components/interview-public/InterviewVerificationForm";

type Props = {
  params: { locale: string; slug: string; interviewId: string };
};

export default async function InterviewEntryPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    notFound();
  }

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview || interview.status !== "published") {
    notFound();
  }

  return (
    <InterviewVerificationForm
      locale={params.locale}
      slug={company.slug}
      interviewId={interview.id}
      interviewTitle={interview.title}
    />
  );
}
