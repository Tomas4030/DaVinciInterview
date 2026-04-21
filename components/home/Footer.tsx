import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)]/50 bg-[var(--c-surface)]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.5fr_auto_auto_auto] md:items-start">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--c-brand)] text-[11px] font-bold text-white">
                C
              </div>
              <span className="text-[0.9rem] font-semibold tracking-tight text-[var(--c-text)]">
                MatchWorky
              </span>
            </div>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-[var(--c-text)]/55">
              Plataforma SaaS de entrevistas conversacionais com IA. Automatiza
              a triagem inicial e melhora a experiência de candidatura.
            </p>
          </div>

          {/* Produto */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              Produto
            </span>
            <a
              href="#funcionalidades"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Funcionalidades
            </a>
            <a
              href="#como-funciona"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Como funciona
            </a>
            <Link
              href="/pricing"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Preços
            </Link>
            <Link
              href="/signup"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Começar grátis
            </Link>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              Empresa
            </span>
            <Link
              href="/sobre"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Sobre nós
            </Link>
            <a
              href="mailto:hello@MatchWorky.pt"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Contacto
            </a>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              Legal
            </span>
            <Link
              href="/termos"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Termos de Serviço
            </Link>
            <Link
              href="/privacidade"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--c-border)]/50 py-5">
          <p className="text-[0.75rem] text-[var(--c-text)]/40">
            © {new Date().getFullYear()} MatchWorky. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
