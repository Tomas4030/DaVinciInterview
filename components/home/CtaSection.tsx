import Link from "next/link";
import { normalizeLocale } from "@/lib/i18n/locales";
import { tLanding } from "@/lib/i18n/landing";

type CtaSectionProps = {
  locale?: string;
};

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default function CtaSection({ locale = "en" }: CtaSectionProps) {
  const eyebrow = tLanding(locale, "cta.eyebrow");
  const title = tLanding(locale, "cta.title");
  const description = tLanding(locale, "cta.description");
  const primary = tLanding(locale, "cta.primary");
  const secondary = tLanding(locale, "cta.secondary");
  const footnote = tLanding(locale, "cta.footnote");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--c-brand)] px-10 py-14 text-center shadow-[0_16px_48px_rgba(67,85,232,0.3)]">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
          aria-hidden="true"
        />
        {/* Glow */}
        <div
          className="pointer-events-none absolute right-1/4 top-0 h-64 w-64 rounded-full bg-white/10 blur-[80px]"
          aria-hidden="true"
        />

        <div className="relative">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-white/60">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[0.95rem] leading-relaxed text-white/70">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={withLocale("/signup", locale)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[0.85rem] font-bold text-[var(--c-brand)] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-[2px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-[0.98]"
            >
              {primary}
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
            </Link>
            <Link
              href={withLocale("/pricing", locale)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-[0.85rem] font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              {secondary}
            </Link>
          </div>
          <p className="mt-5 text-[0.75rem] text-white/45">
            {footnote}
          </p>
        </div>
      </div>
    </section>
  );
}
