import type { Metadata } from "next";
import {
  Header,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  CtaSection,
  Footer,
} from "@/components/home";
import { tLanding } from "@/lib/i18n/landing";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  const title = tLanding(params.locale, "meta.title");
  const description = tLanding(params.locale, "meta.description");
  const ogTitle = tLanding(params.locale, "meta.ogTitle");
  const ogDescription = tLanding(params.locale, "meta.ogDescription");

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      url: `/${params.locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}

export default function HomePage({ params }: Props) {
  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header locale={params.locale} />
      <HeroSection locale={params.locale} />
      <FeaturesSection locale={params.locale} />
      <HowItWorksSection locale={params.locale} />
      <TestimonialsSection locale={params.locale} />
      <PricingSection compact locale={params.locale} />
      <CtaSection locale={params.locale} />
      <Footer locale={params.locale} />
    </main>
  );
}
