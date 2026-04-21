import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)]/50 bg-[var(--c-surface)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1fr_auto_auto] md:items-start">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--c-brand)] font-display text-[11px] font-bold text-white">
                D
              </div>
              <span className="text-[0.82rem] font-semibold tracking-tight text-[var(--c-text)]">
                MatchWorky Interviews
              </span>
            </div>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-[var(--c-text)]/55">
              Plataforma de entrevistas em formato conversacional. Simplifica o
              processo de recrutamento para candidatos e empresas.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--c-text)]/45">
              Plataforma
            </span>

            <a
              href="#vagas"
              className="text-[0.82rem] text-[var(--c-text)]/65 transition-colors duration-150 hover:text-[var(--c-text)]"
            >
              Vagas abertas
            </a>
            <a
              href="#como-funciona"
              className="text-[0.82rem] text-[var(--c-text)]/65 transition-colors duration-150 hover:text-[var(--c-text)]"
            >
              Como funciona
            </a>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--c-text)]/45">
              Info
            </span>
            <p className="text-[0.82rem] text-[var(--c-text)]/65">
              © {new Date().getFullYear()} MatchWorky Interviews. <br /> Todos
              os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
