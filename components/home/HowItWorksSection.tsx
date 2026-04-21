const STEPS = [
  {
    num: "01",
    title: "Cria a tua vaga",
    desc: "Define o título, a descrição e as perguntas que queres fazer aos candidatos. Podes ter múltiplas vagas ativas em simultâneo.",
    highlight: "Configuração em minutos",
    accent: "border-blue-100",
    dot: "bg-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-600",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Partilha o link",
    desc: "Cada vaga tem um URL único. Partilha-o nas redes sociais, no teu site ou por email — os candidatos acedem sem criar conta.",
    highlight: "Sem fricção para o candidato",
    accent: "border-violet-100",
    dot: "bg-violet-600",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    iconBg: "bg-violet-600",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Analisa as respostas",
    desc: "Todas as candidaturas ficam no teu dashboard. A IA gera um resumo e scoring de cada candidato para que te foques nos melhores.",
    highlight: "Decisões baseadas em dados",
    accent: "border-emerald-100",
    dot: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-600",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden py-20 md:py-28"
      aria-label="Como funciona o MatchWorky"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.05]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--c-brand)]">
            Como funciona
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--c-text)] md:text-4xl">
            Da vaga à contratação em 3 passos
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--c-text)]/60">
            O processo foi desenhado para ser simples para ti e agradável para
            os candidatos.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className={`group relative rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg ${step.accent}`}
            >
              <div
                className="absolute left-8 top-0 h-0.5 w-14 rounded-full bg-gradient-to-r from-[var(--c-brand)] to-[var(--c-brand)]/30"
                aria-hidden="true"
              />

              <div className="mb-6 flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${step.iconBg}`}
                >
                  {step.icon}
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${step.badge}`}
                >
                  Passo {step.num}
                </span>
              </div>

              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="text-sm leading-7 text-slate-600">{step.desc}</p>

              <div
                className="mt-6 h-px w-full bg-slate-100"
                aria-hidden="true"
              />

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--c-brand)]">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${step.dot}`}
                  aria-hidden="true"
                />
                {step.highlight}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
