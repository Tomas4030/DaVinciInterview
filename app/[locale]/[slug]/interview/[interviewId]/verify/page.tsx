import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import InterviewVerifyCodeForm from "@/components/interview-public/InterviewVerifyCodeForm";

type Props = {
  params: { locale: string; slug: string; interviewId: string };
  searchParams: {
    email?: string;
    telefone?: string;
    candidateName?: string;
  };
};

export default async function InterviewVerifyPage({
  params,
  searchParams,
}: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    notFound();
  }

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview || interview.status !== "published") {
    notFound();
  }

  const email = String(searchParams.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    notFound();
  }

  return (
    <InterviewVerifyCodeForm
      locale={params.locale}
      slug={company.slug}
      interviewId={interview.id}
      email={email}
      telefone={String(searchParams.telefone || "").trim()}
      candidateName={String(searchParams.candidateName || "").trim()}
    />
  );
}
