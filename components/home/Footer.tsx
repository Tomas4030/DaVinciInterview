import Link from "next/link";
import { normalizeLocale } from "@/lib/i18n/locales";
import { tLanding } from "@/lib/i18n/landing";

type FooterProps = {
  locale?: string;
};

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default function Footer({ locale = "en" }: FooterProps) {
  const description = tLanding(locale, "footer.description");
  const product = tLanding(locale, "footer.product");
  const features = tLanding(locale, "footer.features");
  const howItWorks = tLanding(locale, "footer.howItWorks");
  const pricing = tLanding(locale, "footer.pricing");
  const startFree = tLanding(locale, "footer.startFree");
  const company = tLanding(locale, "footer.company");
  const about = tLanding(locale, "footer.about");
  const contact = tLanding(locale, "footer.contact");
  const legal = tLanding(locale, "footer.legal");
  const terms = tLanding(locale, "footer.terms");
  const privacy = tLanding(locale, "footer.privacy");
  const rights = tLanding(locale, "footer.rights");

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
              {description}
            </p>
          </div>

          {/* Produto */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              {product}
            </span>
            <a
              href="#funcionalidades"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {features}
            </a>
            <a
              href="#como-funciona"
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {howItWorks}
            </a>
            <Link
              href={withLocale("/pricing", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {pricing}
            </Link>
            <Link
              href={withLocale("/signup", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {startFree}
            </Link>
          </div>

          {/* Empresa */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              {company}
            </span>
            <Link
              href={withLocale("/sobre", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {about}
            </Link>
            <Link
              href={withLocale("/contacto", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {contact}
            </Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-text)]/40">
              {legal}
            </span>
            <Link
              href={withLocale("/termos", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {terms}
            </Link>
            <Link
              href={withLocale("/privacidade", locale)}
              className="text-[0.8rem] text-[var(--c-text)]/60 transition-colors hover:text-[var(--c-text)]"
            >
              {privacy}
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--c-border)]/50 py-5">
            <p className="text-[0.75rem] text-[var(--c-text)]/40">
              © {new Date().getFullYear()} MatchWorky. {rights}
            </p>
        </div>
      </div>
    </footer>
  );
}
