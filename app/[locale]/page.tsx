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

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "MatchWorky — Entrevistas com IA para equipas de recrutamento",
    description:
      "Automatiza a triagem de candidatos com entrevistas conversacionais. Define as perguntas, partilha o link e analisa as respostas tudo numa plataforma.",
    alternates: {
      canonical: `/${params.locale}`,
    },
    openGraph: {
      title: "MatchWorky — Entrevistas com IA para empresas",
      description:
        "Automatiza a triagem inicial e melhora a experiência de candidatura com entrevistas conversacionais inteligentes.",
      type: "website",
      url: `/${params.locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: "MatchWorky — Entrevistas com IA para empresas",
      description:
        "Automatiza a triagem inicial e melhora a experiência de candidatura com entrevistas conversacionais inteligentes.",
    },
  };
}

export default function HomePage({ params }: Props) {
  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header locale={params.locale} />
      <HeroSection locale={params.locale} />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection compact />
      <CtaSection locale={params.locale} />
      <Footer locale={params.locale} />
    </main>
  );
}
