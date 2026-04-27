import { tLanding, tLandingObject } from "@/lib/i18n/landing";

const FEATURES = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Entrevistas conversacionais",
    desc: "O candidato responde numa interface de chat simples — sem formulários confusos, sem PDFs, sem fricção.",
    color: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
      </svg>
    ),
    title: "Verificação automática",
    desc: "Email e telemóvel validados por código OTP — garantes que cada candidato é único e autêntico.",
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: "Dashboard de candidaturas",
    desc: "Visualiza todas as respostas organizadas numa interface limpa. Filtra, pesquisa e exporta com um clique.",
    color: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Questionários personalizados",
    desc: "Cria perguntas específicas para cada vaga. Adiciona, reordena e remove sem esforço.",
    color: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    title: "Análise com IA",
    desc: "Análise automática das respostas dos candidatos com scoring e resumo gerado por inteligência artificial.",
    color: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Exportação de relatórios",
    desc: "Exporta candidaturas em PDF ou CSV para partilhar com a tua equipa ou integrar com outros sistemas.",
    color: "bg-sky-50 text-sky-600 ring-sky-100",
  },
];

type FeaturesSectionProps = {
  locale?: string;
};

export default function FeaturesSection({ locale = "en" }: FeaturesSectionProps) {
  const eyebrow = tLanding(locale, "features.eyebrow");
  const title = tLanding(locale, "features.title");
  const description = tLanding(locale, "features.description");
  const translatedItems = tLandingObject<Array<{ title: string; desc: string }>>(
    locale,
    "features.items",
  );
  const features = FEATURES.map((feature, index) => ({
    ...feature,
    title: translatedItems[index]?.title || feature.title,
    desc: translatedItems[index]?.desc || feature.desc,
  }));

  return (
    <section
      id="funcionalidades"
      className="mx-auto max-w-6xl px-6 py-20 md:py-28"
    >
      {/* Header */}
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--c-brand)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--c-text)] md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--c-text)]/60">
          {description}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-6
                       transition-all duration-300 hover:-translate-y-1 hover:border-[var(--c-brand)]/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
          >
            <div
              className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${f.color}`}
            >
              {f.icon}
            </div>
            <h3 className="mb-2 text-[0.95rem] font-semibold text-[var(--c-text)]">
              {f.title}
            </h3>
            <p className="text-[0.82rem] leading-relaxed text-[var(--c-text)]/60">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
