import type { Metadata } from "next";
import StaticInfoPage from "@/components/home/StaticInfoPage";

export const metadata: Metadata = {
  title: "Termos de Servico",
  description:
    "Condicoes de uso da plataforma MatchWorky para equipas de recrutamento e candidatos.",
  alternates: {
    canonical: "/termos",
  },
};

export default function TermsPage() {
  return (
    <StaticInfoPage
      eyebrow="Legal"
      title="Termos de servico"
      description="Ao usar o MatchWorky, aceita estas condicoes para garantir uma utilizacao clara, segura e previsivel para empresas e candidatos."
      sideNoteTitle="Versao atual"
      sideNoteBody="Estes termos aplicam-se a toda a utilizacao da plataforma web. Quando forem atualizados, a data de revisao sera publicada nesta pagina."
      sections={[
        {
          title: "1. Utilizacao da plataforma",
          body: [
            "A plataforma destina-se a equipas de recrutamento que pretendem estruturar entrevistas iniciais com apoio de IA.",
            "Nao e permitido usar o servico para recolha de dados sem base legal, envio de conteudo abusivo ou qualquer atividade que viole legislacao aplicavel.",
          ],
        },
        {
          title: "2. Contas e acesso",
          body: [
            "Cada conta empresarial e responsavel pela gestao dos seus acessos administrativos e pela seguranca das credenciais.",
            "Recomendamos a revisao regular de utilizadores com acesso ao painel e a revogacao imediata de acessos que deixem de ser necessarios.",
          ],
          tone: "blue",
        },
        {
          title: "3. Dados de entrevistas",
          body: [
            "Os dados recolhidos durante entrevistas pertencem ao cliente que cria a vaga e devem ser tratados de acordo com a politica interna de recrutamento.",
            "A MatchWorky processa os dados para disponibilizar funcionalidades de triagem, analise e relatorios, sem uso comercial paralelo desses dados.",
          ],
          tone: "green",
        },
        {
          title: "4. Disponibilidade e suporte",
          body: [
            "Trabalhamos para garantir elevada disponibilidade, mas podem ocorrer interrupcoes pontuais para manutencao, atualizacoes ou mitigacao de incidentes.",
            "Questoes operacionais podem ser reportadas pela pagina de contacto para acompanhamento tecnico.",
          ],
          tone: "yellow",
        },
      ]}
    />
  );
}
