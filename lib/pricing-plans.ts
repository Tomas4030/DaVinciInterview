export type PricingPlan = {
  id: "basic" | "pro" | "enterprise";
  name: string;
  priceLabel: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceLabel: "49 EUR",
    cadence: "/mes",
    description: "Para equipas pequenas que querem acelerar triagem inicial.",
    features: [
      "1 empresa",
      "Ate 5 entrevistas ativas",
      "Dashboard base",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "149 EUR",
    cadence: "/mes",
    description: "Escala com mais volume e mais controlo operacional.",
    features: [
      "Ate 3 empresas",
      "Entrevistas ilimitadas",
      "Insights de desempenho",
      "Prioridade no suporte",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Personalizado",
    cadence: "",
    description: "Para equipas com requisitos avancados de seguranca e escala.",
    features: [
      "Multi-empresa avancado",
      "SLA dedicado",
      "Apoio tecnico e onboarding",
      "Integracoes customizadas",
    ],
  },
];
