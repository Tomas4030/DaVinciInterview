import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Página inicial — MatchWorky Interviews"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--c-brand)] font-display text-[11px] font-bold text-white shadow-[0_1px_3px_rgba(67,85,232,0.18)] transition-transform duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06] group-active:scale-[0.98]">
            D
          </div>
          <span className="text-[0.82rem] font-semibold tracking-tight text-[var(--c-text)]">
            MatchWorky Interviews
          </span>
        </Link>
      </div>
    </header>
  );
}
