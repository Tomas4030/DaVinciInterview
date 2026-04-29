import Link from "next/link";
import GridPattern from "./GridPattern";
import HeroChatPreview from "./HeroChatPreview";
import { tLanding, tLandingObject } from "@/lib/i18n/landing";
import { normalizeLocale } from "@/lib/i18n/locales";

type HeroSectionProps = {
  locale?: string;
};

type PreviewMessage = {
  from: "bot" | "user";
  text: string;
};

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default function HeroSection({ locale = "en" }: HeroSectionProps) {
  const badge = tLanding(locale, "hero.badge");
  const titleLine1 = tLanding(locale, "hero.titleLine1");
  const titleHighlight = tLanding(locale, "hero.titleHighlight");
  const titleLine2 = tLanding(locale, "hero.titleLine2");
  const description = tLanding(locale, "hero.description");
  const cta = tLanding(locale, "hero.cta");
  const stats = tLandingObject<Array<{ value: string; label: string }>>(
    locale,
    "hero.stats",
  );
  const previewLabel = tLanding(locale, "hero.preview.label");
  const previewMessages = tLandingObject<PreviewMessage[]>(
    locale,
    "hero.preview.conversation",
  );

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
              {badge}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-reveal text-balance font-display text-[2.6rem] leading-[1.08] tracking-[-0.03em] text-[var(--c-text)] md:text-[4rem]"
            style={{ animationDelay: "60ms" }}
          >
            {titleLine1}
            <br />
            <span className="text-[var(--c-brand)]">{titleHighlight}</span>{" "}
            {titleLine2}
          </h1>

          {/* Sub */}
          <p
            className="mt-6 max-w-[520px] animate-reveal text-[1rem] leading-relaxed text-[var(--c-text)]/60 md:text-[1.08rem]"
            style={{ animationDelay: "120ms" }}
          >
            {description}
          </p>

          {/* CTAs */}
          <div
            className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 animate-reveal"
            style={{ animationDelay: "200ms" }}
          >
            <Link
              href={withLocale("/plans", locale)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--c-brand)] px-6 py-3 text-[0.85rem] font-semibold text-white
                         shadow-[0_2px_4px_rgba(67,85,232,0.15),0_6px_24px_rgba(67,85,232,0.2)]
                         transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_8px_rgba(67,85,232,0.15),0_12px_36px_rgba(67,85,232,0.28)]
                         active:scale-[0.985]"
            >
              {cta}
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
          </div>

          {/* Social proof */}
          <div
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 animate-reveal "
            style={{ animationDelay: "280ms" }}
          >
            {stats.map((stat) => (
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
          className="absolute right-0 top-[25%] hidden -translate-y-1/2 lg:block animate-reveal"
          style={{ animationDelay: "320ms" }}
          aria-hidden="true"
        >
          <HeroChatPreview
            previewLabel={previewLabel}
            messages={previewMessages}
            loop
          />
        </div>
      </div>
    </section>
  );
}
