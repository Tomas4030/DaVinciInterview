import { tLanding, tLandingObject } from "@/lib/i18n/landing";

const TESTIMONIALS = [
  {
    quote:
      "Reduziamos semanas a rever CVs. Com o MatchWorky, em dois dias já tínhamos os 5 melhores candidatos prontos para entrevista presencial.",
    author: "Ana Rodrigues",
    role: "Head of People, TechStartup Lisboa",
    initials: "AR",
    color: "bg-blue-100 text-blue-700",
  },
  {
    quote:
      "A experiência para os candidatos é incrível. Zero frustração, zero formulários enormes. As pessoas adoram responder desta forma.",
    author: "Miguel Santos",
    role: "Talent Acquisition, Scale-up Porto",
    initials: "MS",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote:
      "O resumo automático da IA poupa-nos pelo menos 2 horas por candidato. Para nós, foi um game changer no recrutamento técnico.",
    author: "Sofia Mendes",
    role: "CTO, Produto Digital",
    initials: "SM",
    color: "bg-emerald-100 text-emerald-700",
  },
];

type TestimonialSectionProps = {
  locale?: string;
};

export default function TestimonialSection({ locale = "pt" }: TestimonialSectionProps) {
  const eyebrow = tLanding(locale, "testimonials.eyebrow");
  const title = tLanding(locale, "testimonials.title");
  const translatedItems = tLandingObject<
    Array<{ quote: string; author: string; role: string }>
  >(locale, "testimonials.items");
  const testimonials = TESTIMONIALS.map((item, index) => ({
    ...item,
    quote: translatedItems[index]?.quote || item.quote,
    author: translatedItems[index]?.author || item.author,
    role: translatedItems[index]?.role || item.role,
  }));

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--c-brand)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--c-text)]">
          {title}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.author}
            className="rounded-2xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
          >
            {/* Stars */}
            <div className="mb-4 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-amber-400"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>

            <blockquote className="mb-5 text-[0.85rem] leading-relaxed text-[var(--c-text)]/75 italic">
              "{t.quote}"
            </blockquote>

            <figcaption className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.color}`}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-[0.82rem] font-semibold text-[var(--c-text)]">
                  {t.author}
                </p>
                <p className="text-[0.72rem] text-[var(--c-text)]/50">
                  {t.role}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
