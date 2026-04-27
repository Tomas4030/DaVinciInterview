import type { Metadata } from "next";
import StaticInfoPage from "@/components/home/StaticInfoPage";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Sobre nos",
    description:
      "Conhece a missao da MatchWorky e a forma como desenhamos entrevistas mais claras para equipas e candidatos.",
    alternates: {
      canonical: `/${params.locale}/sobre`,
    },
  };
}

export default function AboutPage({ params }: Props) {
  return (
    <StaticInfoPage
      locale={params.locale}
      eyebrow="Empresa"
      title="Sobre nos"
      description="A MatchWorky nasce para reduzir friccao no recrutamento inicial, com entrevistas consistentes e uma leitura objetiva das respostas."
      sideNoteTitle="Foco"
      sideNoteBody="Construimos um produto simples de operar no dia a dia: criar vaga, partilhar link, acompanhar respostas e decidir com contexto."
      sections={[
        {
          title: "1. Porque existimos",
          body: [
            "Muitas equipas perdem tempo com triagem manual e entrevistas iniciais pouco estruturadas.",
            "Criamos uma camada conversacional para padronizar esta etapa, mantendo espaco para criterio humano na decisao final.",
          ],
        },
        {
          title: "2. Como trabalhamos",
          body: [
            "O produto privilegia clareza: interface objetiva, resultados comparaveis e configuracao enxuta para cada vaga.",
            "Todas as melhorias sao validadas com base em uso real por equipas de recrutamento, nao em tendencias visuais de curto prazo.",
          ],
          tone: "blue",
        },
        {
          title: "3. Principios de produto",
          body: [
            "Respeito pela experiencia do candidato, com fluxos transparentes e comunicacao direta.",
            "Privacidade por padrao, com controlo dos dados por parte das empresas e trilho minimo necessario para auditoria.",
          ],
          tone: "green",
        },
      ]}
    />
  );
}
