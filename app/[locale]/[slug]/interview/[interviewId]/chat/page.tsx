import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import InterviewChatClient from "@/components/interview-public/InterviewChatClient";

type Props = {
  params: { slug: string; interviewId: string };
};

type InterviewQuestionInput = {
  id?: number;
  texto?: string;
  question?: string;
};

function normalizeQuestions(rawQuestions: any[]) {
  return rawQuestions
    .map((entry: InterviewQuestionInput, index: number) => {
      const text = String(entry?.question || entry?.texto || "").trim();
      if (!text) return null;
      return {
        id: Number(entry?.id || index + 1),
        text,
      };
    })
    .filter(Boolean) as Array<{ id: number; text: string }>;
}

export default async function InterviewChatPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") {
    notFound();
  }

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview || interview.status !== "published") {
    notFound();
  }

  const normalizedQuestions = normalizeQuestions(
    Array.isArray(interview.questions) ? interview.questions : [],
  );

  return (
    <InterviewChatClient
      slug={company.slug}
      interviewId={interview.id}
      companyName={company.name}
      companyLogoUrl={company.logo_url || ""}
      companyDescription={String(company.description || "")}
      interviewTitle={interview.title}
      interviewDescription={String(interview.description || "")}
      questions={normalizedQuestions}
    />
  );
}
