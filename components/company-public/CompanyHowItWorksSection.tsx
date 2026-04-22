const COMPANY_STEPS = [
  {
    title: "Escolhe a entrevista",
    desc: "Ves as posicoes abertas desta empresa e escolhes a que encaixa melhor no teu perfil.",
    badge: "Passo 01",
    highlight: "Tudo centralizado num so sitio",
  },
  {
    title: "Responde em formato chat",
    desc: "A candidatura segue um fluxo conversacional para tornares o processo mais natural e direto.",
    badge: "Passo 02",
    highlight: "Experiencia simples e guiada",
  },
  {
    title: "Submete e acompanha",
    desc: "Depois de concluir, os dados ficam estruturados para a equipa de recrutamento analisar rapidamente.",
    badge: "Passo 03",
    highlight: "Envio rapido e claro",
  },
];

export default function CompanyHowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden border-y border-[var(--c-border)]/60 py-20 md:py-24"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.06]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-sm font-medium text-[var(--c-text)]/75">
            <span className="h-2 w-2 rounded-full bg-[var(--c-brand)]" />
            Processo simples e rapido
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-[var(--c-text)] sm:text-4xl">
            Como funciona
          </h2>

          <p className="mt-4 text-base leading-7 text-[var(--c-text)]/65 sm:text-lg">
            Escolhe a entrevista, responde ao teu ritmo e envia tudo em poucos minutos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COMPANY_STEPS.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-[var(--c-border)]/75 bg-[var(--c-surface)] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--c-brand)] text-white">
                  {item.badge.slice(-2)}
                </span>
                <span className="rounded-full border border-[var(--c-border)] px-3 py-1 text-xs font-semibold text-[var(--c-text)]/70">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-[var(--c-text)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--c-text)]/62">{item.desc}</p>

              <div className="mt-5 h-px w-full bg-[var(--c-border)]/60" aria-hidden="true" />
              <p className="mt-4 text-sm font-medium text-[var(--c-brand)]">{item.highlight}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
