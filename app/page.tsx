// app/page.tsx
import type { Metadata } from "next";
import { listarVagasAtivas, type VagaResumo } from "@/lib/api";
import {
  Header,
  HeroSection,
  VagasSection,
  HowItWorksSection,
  PricingSection,
  Footer,
} from "@/components/home";

export const revalidate = 60; // Cache curto para reduzir TTFB sem perder atualizações recentes

export const metadata: Metadata = {
  title: "Entrevistas com IA para empresas",
  description:
    "Landing principal da plataforma SaaS de entrevistas. Conhece funcionalidades e planos para equipas de recrutamento.",
  openGraph: {
    title: "Chat2Work - Entrevistas com IA para empresas",
    description:
      "Automatiza triagem inicial e melhora a experiencia de candidatura com entrevistas conversacionais.",
    type: "website",
  },
};

export default async function HomePage() {
  let vagas: VagaResumo[] = [];

  try {
    vagas = await listarVagasAtivas();
  } catch {
    vagas = [];
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header />
      <HeroSection />
      <VagasSection vagas={vagas} />
      <HowItWorksSection />
      <PricingSection compact />
      <Footer />
    </main>
  );
}
