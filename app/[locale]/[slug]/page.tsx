import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  CompanyHowItWorksSection,
  CompanyInterviewsSection,
  CompanyPublicHeader,
  CompanyPublicHero,
} from "@/components/company-public";
import { Footer } from "@/components/home";
import { ADMIN_SESSION_COOKIE, parseAdminToken } from "@/lib/admin-auth";
import { tInterview } from "@/lib/i18n/interview";
import { hasPendingInviteForCompanyAndEmail } from "@/lib/queries/company-invites";
import { getCompanyBySlug, getCompanyMembershipBySlug } from "@/lib/queries/companies";
import { listPublishedInterviewsByCompany } from "@/lib/queries/interviews";

type Props = {
  params: { locale: string; slug: string };
};

function isCompanyInactive(subscriptionStatus: string): boolean {
  return subscriptionStatus === "canceled";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug);

  if (!company || isCompanyInactive(company.subscription_status)) {
    return {
      title: tInterview(params.locale, "companyPublic.meta.notFound"),
    };
  }

  const description =
    company.description ||
    tInterview(params.locale, "companyPublic.meta.descriptionFallback", {
      companyName: company.name,
    });

  const title = tInterview(params.locale, "companyPublic.meta.title", {
    companyName: company.name,
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}/${company.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/${params.locale}/${company.slug}`,
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
      title,
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

  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const session = parseAdminToken(token);

  let adminEmailForCompany: string | undefined;
  if (session) {
    const [membership, hasPendingInvite] = await Promise.all([
      getCompanyMembershipBySlug(session.userId, params.slug),
      hasPendingInviteForCompanyAndEmail(company.id, session.email),
    ]);

    if (membership || hasPendingInvite) {
      adminEmailForCompany = session.email;
    }
  }

  const interviews = await listPublishedInterviewsByCompany(company.id);

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <CompanyPublicHeader
        company={company}
        locale={params.locale}
        adminEmail={adminEmailForCompany}
      />
      <CompanyPublicHero
        company={company}
        interviewsCount={interviews.length}
        locale={params.locale}
      />
      <CompanyInterviewsSection
        companySlug={company.slug}
        interviews={interviews}
        locale={params.locale}
      />
      <CompanyHowItWorksSection locale={params.locale} />
      <Footer locale={params.locale} />
    </main>
  );
}
