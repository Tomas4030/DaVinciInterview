import GridPattern from "./GridPattern";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <GridPattern />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--c-bg)] to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] -translate-y-1/3 rounded-full bg-[var(--c-brand)]/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-[var(--c-brand)]/[0.04] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-32">
        <div className="max-w-[700px] ">
          {/* Badge */}
          <div className="mb-7 inline-flex animate-reveal items-center gap-2.5 rounded-full bg-[var(--c-brand)]/3 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--c-brand)] opacity-50 [animation-duration:1.4s]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--c-brand)]" />
            </span>
            <span className="text-[0.75rem] font-semibold tracking-wide text-[var(--c-brand)] ">
              Automatiza o teu processo de recrutamento
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-reveal text-balance font-display text-[2.6rem] leading-[1.08] tracking-[-0.03em] text-[var(--c-text)] md:text-[4rem]"
            style={{ animationDelay: "60ms" }}
          >
            Entrevistas com IA.
            <br />
            <span className="text-[var(--c-brand)]">Triagem</span> sem esforço.
          </h1>

          {/* Sub */}
          <p
            className="mt-6 max-w-[520px] animate-reveal text-[1rem] leading-relaxed text-[var(--c-text)]/60 md:text-[1.08rem]"
            style={{ animationDelay: "120ms" }}
          >
            O MatchWorky conduz entrevistas conversacionais automatizadas em
            nome da tua empresa. Define as perguntas, partilha o link com os
            candidatos e analisa as respostas tudo numa plataforma.
          </p>

          {/* CTAs */}
          <div
            className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 animate-reveal"
            style={{ animationDelay: "200ms" }}
          >
            <a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--c-brand)] px-6 py-3 text-[0.85rem] font-semibold text-white
                         shadow-[0_2px_4px_rgba(67,85,232,0.15),0_6px_24px_rgba(67,85,232,0.2)]
                         transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_8px_rgba(67,85,232,0.15),0_12px_36px_rgba(67,85,232,0.28)]
                         active:scale-[0.985]"
            >
              Começar grátis
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Social proof */}
          <div
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 animate-reveal border-t border-[var(--c-border)]/50 pt-8"
            style={{ animationDelay: "280ms" }}
          >
            {[
              { value: "3×", label: "mais rápido do que triagem manual" },
              { value: "80%", label: "redução no tempo de recrutamento" },
              { value: "100%", label: "candidaturas estruturadas" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-[1.4rem] font-bold tracking-tight text-[var(--c-brand)]">
                  {stat.value}
                </span>
                <span className="text-[0.72rem] text-[var(--c-text)]/50">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative chat preview */}
        <div
          className="absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block animate-reveal"
          style={{ animationDelay: "320ms" }}
          aria-hidden="true"
        >
          <ChatPreview />
        </div>
      </div>
    </section>
  );
}

function ChatPreview() {
  return (
    <div className="w-72 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--c-border)]/60 pb-3">
        <div className="h-7 w-7 rounded-lg bg-[var(--c-brand)] flex items-center justify-center text-[10px] font-bold text-white">
          C
        </div>
        <div>
          <p className="text-[0.72rem] font-semibold text-[var(--c-text)]">
            MatchWorky
          </p>
          <p className="text-[0.65rem] text-[var(--c-text)]/50">
            Entrevista Automática
          </p>
        </div>
        <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>
      <div className="space-y-2.5">
        <Bubble
          from="bot"
          text="Olá! Sou o assistente de recrutamento da Acme. Vamos começar com algumas perguntas?"
        />
        <Bubble from="user" text="Claro, estou pronto!" />
        <Bubble
          from="bot"
          text="Ótimo! Fala-me um pouco sobre a tua experiência com React e TypeScript."
        />
        <div className="flex items-center gap-1.5 pt-1">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/60 [animation-delay:0ms]" />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/60 [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--c-brand)]/60 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function Bubble({ from, text }: { from: "bot" | "user"; text: string }) {
  if (from === "bot") {
    return (
      <div className="flex gap-1.5">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-md bg-[var(--c-brand)] flex items-center justify-center text-[8px] font-bold text-white">
          C
        </div>
        <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[var(--c-bg)] px-3 py-2 text-[0.68rem] leading-relaxed text-[var(--c-text)]/80">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-[var(--c-brand)] px-3 py-2 text-[0.68rem] leading-relaxed text-white">
        {text}
      </div>
    </div>
  );
}
