import type { Metadata } from "next";
import { Header, PricingSection, Footer } from "@/components/home";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Planos e Precos",
    description:
      "Compara os planos da plataforma e escolhe a melhor opcao para digitalizar entrevistas da tua empresa.",
    alternates: {
      canonical: `/${params.locale}/pricing`,
    },
    openGraph: {
      title: "Planos e Precos",
      description:
        "Compara os planos da plataforma e escolhe a melhor opcao para digitalizar entrevistas da tua empresa.",
      type: "website",
      url: `/${params.locale}/pricing`,
    },
  };
}

export default function PricingPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-[var(--c-bg)]">
      <Header locale={params.locale} />
      <PricingSection locale={params.locale} />
      <Footer locale={params.locale} />
    </main>
  );
}
