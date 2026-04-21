// app/page.tsx
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

export const metadata: Metadata = {
  title: "MatchWorky — Entrevistas com IA para equipas de recrutamento",
  description:
    "Automatiza a triagem de candidatos com entrevistas conversacionais. Define as perguntas, partilha o link e analisa as respostas — tudo numa plataforma.",
  openGraph: {
    title: "MatchWorky — Entrevistas com IA para empresas",
    description:
      "Automatiza a triagem inicial e melhora a experiência de candidatura com entrevistas conversacionais inteligentes.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection compact />
      <CtaSection />
      <Footer />
    </main>
  );
}
