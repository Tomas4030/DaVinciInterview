import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InterviewVerificationForm from "@/components/interview-public/InterviewVerificationForm";
import { stripInterviewMetaFromDescription } from "@/lib/interview-meta";
import { tInterview } from "@/lib/i18n/interview";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";

export const dynamic = "force-dynamic";

type Props = {
  params: { locale: string; slug: string; interviewId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    return {
      title: "Interview",
    };
  }

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview || interview.status !== "published") {
    return {
      title: "Interview",
    };
  }

  return {
    title: `${interview.title} - ${tInterview(params.locale, "companyPublic.interviews.start")}`,
    description: stripInterviewMetaFromDescription(
      String(interview.description || ""),
    ),
  };
}

export default async function InterviewStartPage({ params }: Props) {
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
