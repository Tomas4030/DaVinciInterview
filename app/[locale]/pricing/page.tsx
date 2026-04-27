import type { Metadata } from "next";
import { Header, PricingSection, Footer } from "@/components/home";

export const metadata: Metadata = {
  title: "Planos e Precos",
  description:
    "Compara os planos da plataforma e escolhe a melhor opcao para digitalizar entrevistas da tua empresa.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Planos e Precos",
    description:
      "Compara os planos da plataforma e escolhe a melhor opcao para digitalizar entrevistas da tua empresa.",
    type: "website",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header />
      <PricingSection />
      <Footer />
    </main>
  );
}
