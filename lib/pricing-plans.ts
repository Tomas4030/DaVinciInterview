export type PricingPlan = {
  id: "free" | "basic" | "pro";
  name: string;
  monthlyPriceEur?: number;
  priceLabel?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPriceEur: 0,
    description: "Ideal para testar a plataforma com limites de uso.",
    features: [
      "1 empresa",
      "Ate 1 entrevista ativa",
      "Ate 5 perguntas por entrevista",
      "Sem geracao de perguntas por IA",
      "Sem exportacao PDF",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPriceEur: 49,
    description: "Para equipas pequenas que querem acelerar triagem inicial.",
    features: [
      "1 empresa",
      "Ate 5 entrevistas ativas",
      "Perguntas ilimitadas",
      "Dashboard base",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPriceEur: 149,
    description: "Escala com mais volume e mais controlo operacional.",
    features: [
      "Ate 3 empresas",
      "Entrevistas ativas ilimitadas",
      "Perguntas ilimitadas",
      "Insights de desempenho",
      "Prioridade no suporte",
    ],
    highlighted: true,
  },
];
