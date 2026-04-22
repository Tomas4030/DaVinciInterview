import { IconGlobe, IconLayers, IconBuilding } from "../ui/Icons";

export type ModalidadeConfig = {
  badge: string;
  dot: string;
  Icon: React.FC;
};

export const MODALIDADE_CONFIG: Record<string, ModalidadeConfig> = {
  Remoto: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50",
    dot: "bg-sky-500",
    Icon: IconGlobe,
  },
  Híbrido: {
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/50",
    dot: "bg-violet-500",
    Icon: IconLayers,
  },
  Presencial: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
    dot: "bg-emerald-500",
    Icon: IconBuilding,
  },
};

export const MODALIDADE_FALLBACK: ModalidadeConfig = {
  badge: "bg-gray-50 text-gray-600 ring-1 ring-gray-200/50",
  dot: "bg-gray-400",
  Icon: IconGlobe,
};

export const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Escolhe a vaga",
    desc: "Consulta as posições abertas e seleciona aquela que melhor se encaixa no teu perfil.",
  },
  {
    num: "2",
    title: "Responde às perguntas",
    desc: "Formato conversacional — responde com calma, sem cronómetro, à tua maneira.",
  },
  {
    num: "3",
    title: "Candidatura submetida",
    desc: "As tuas respostas ficam disponíveis para a equipa de recrutamento avaliar.",
  },
];
