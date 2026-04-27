import type { Metadata } from "next";
import StaticInfoPage from "@/components/home/StaticInfoPage";

type Props = {
  params: { locale: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Politica de Privacidade",
    description:
      "Como os dados pessoais sao recolhidos, usados e protegidos na plataforma MatchWorky.",
    alternates: {
      canonical: `/${params.locale}/privacidade`,
    },
  };
}

export default function PrivacyPage({ params }: Props) {
  return (
    <StaticInfoPage
      locale={params.locale}
      eyebrow="Privacidade"
      title="Politica de privacidade"
      description="Explicamos de forma direta que dados tratamos, por que motivo tratamos e como pode exercer os seus direitos em qualquer momento."
      sideNoteTitle="Responsabilidade"
      sideNoteBody="Cada empresa cliente define a base legal para recrutamento. A MatchWorky atua como processador de dados para operacionalizar entrevistas e analises."
      sections={[
        {
          title: "1. Dados recolhidos",
          body: [
            "Podemos recolher dados de identificacao e contacto, respostas de entrevista e metadados tecnicos de sessao para garantir funcionamento e auditoria basica.",
            "Nao recolhemos informacao sensivel sem necessidade objetiva para o processo de candidatura configurado pela empresa cliente.",
          ],
        },
        {
          title: "2. Finalidades de tratamento",
          body: [
            "Os dados sao utilizados para executar entrevistas, apresentar resultados no painel administrativo e permitir comparacao estruturada entre candidaturas.",
            "Tambem usamos dados tecnicos para seguranca, prevencao de abuso e melhoria de estabilidade da plataforma.",
          ],
          tone: "blue",
        },
        {
          title: "3. Retencao e eliminacao",
          body: [
            "Os dados ficam disponiveis pelo periodo definido por cada cliente, respeitando obrigacoes legais e necessidades legitimas de recrutamento.",
            "Quando solicitado, e possivel eliminar registos ou anonimizar historicos que ja nao sejam necessarios para decisao de contratacao.",
          ],
          tone: "green",
        },
        {
          title: "4. Direitos do titular",
          body: [
            "Pode solicitar acesso, retificacao, apagamento, limitacao de tratamento e portabilidade, nos termos da lei aplicavel.",
            "Pedidos de privacidade podem ser submetidos pela pagina de contacto e serao encaminhados para resposta em prazo razoavel.",
          ],
          tone: "red",
        },
      ]}
    />
  );
}
