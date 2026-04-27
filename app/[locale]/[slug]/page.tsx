import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CompanyHowItWorksSection,
  CompanyInterviewsSection,
  CompanyPublicHeader,
  CompanyPublicHero,
} from "@/components/company-public";
import { Footer } from "@/components/home";
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
      <CompanyPublicHeader company={company} />
      <CompanyPublicHero company={company} interviewsCount={interviews.length} />
      <CompanyInterviewsSection companySlug={company.slug} interviews={interviews} />
      <CompanyHowItWorksSection />
      <Footer />
    </main>
  );
}
