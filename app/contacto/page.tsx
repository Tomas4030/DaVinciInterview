import type { Metadata } from "next";
import StaticInfoPage from "@/components/home/StaticInfoPage";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Fala com a equipa MatchWorky para suporte, questoes comerciais e pedidos relacionados com privacidade.",
  alternates: {
    canonical: "/contacto",
  },
};

export default function ContactPage() {
  return (
    <StaticInfoPage
      eyebrow="Contacto"
      title="Fale connosco"
      description="Se precisa de ajuda com configuracao, faturacao ou privacidade, a nossa equipa responde por canais diretos e objetivos."
      sideNoteTitle="Tempo de resposta"
      sideNoteBody="Pedidos operacionais sao respondidos em dias uteis. Casos urgentes de acesso e seguranca recebem prioridade no mesmo dia."
      sections={[
        {
          title: "Suporte tecnico",
          body: [
            "Email: suporte@matchworky.pt",
            "Inclua, se possivel, o slug da empresa e uma descricao curta do comportamento observado.",
          ],
          tone: "blue",
        },
        {
          title: "Comercial e parcerias",
          body: [
            "Email: hello@matchworky.pt",
            "Partilhe o volume esperado de vagas e o fluxo atual de recrutamento para uma proposta alinhada ao seu contexto.",
          ],
          tone: "yellow",
        },
        {
          title: "Privacidade e dados",
          body: [
            "Email: privacidade@matchworky.pt",
            "Solicitacoes de acesso, retificacao ou eliminacao de dados devem indicar a empresa responsavel pelo processo de recrutamento.",
          ],
          tone: "green",
        },
      ]}
    />
  );
}
