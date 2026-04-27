import { Footer, Header } from "@/components/home";

type Section = {
  title: string;
  body: string[];
  tone?: "neutral" | "blue" | "green" | "yellow" | "red";
};

type StaticInfoPageProps = {
  locale?: string;
  eyebrow: string;
  title: string;
  description: string;
  sections: Section[];
  sideNoteLabel?: string;
  sideNoteTitle: string;
  sideNoteBody: string;
};

const toneClassMap: Record<NonNullable<Section["tone"]>, string> = {
  neutral: "bg-white",
  blue: "bg-[#E1F3FE]",
  green: "bg-[#EDF3EC]",
  yellow: "bg-[#FBF3DB]",
  red: "bg-[#FDEBEC]",
};

export default function StaticInfoPage({
  locale = "pt",
  eyebrow,
  title,
  description,
  sections,
  sideNoteLabel = "Nota",
  sideNoteTitle,
  sideNoteBody,
}: StaticInfoPageProps) {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#2F3437]">
      <Header locale={locale} />

      <section className="relative overflow-hidden border-b border-[#EAEAEA]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            background:
              "radial-gradient(45% 55% at 88% 10%, rgba(149,100,0,0.05), transparent 65%), radial-gradient(35% 35% at 15% 15%, rgba(31,108,159,0.04), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#787774]">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.08] tracking-[-0.03em] text-[#111111] md:text-6xl">
            {title}
          </h1>
          <p className="mt-7 max-w-3xl text-[1rem] leading-relaxed text-[#2F3437] md:text-[1.05rem]">
            {description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <aside className="rounded-xl border border-[#EAEAEA] bg-white p-7 md:col-span-4 md:sticky md:top-24 md:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#787774]">
              {sideNoteLabel}
            </p>
            <h2 className="mt-3 font-display text-2xl leading-tight tracking-[-0.02em] text-[#111111]">
              {sideNoteTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#2F3437]">{sideNoteBody}</p>
          </aside>

          <div className="space-y-4 md:col-span-8">
            {sections.map((section) => (
              <article
                key={section.title}
                className={`rounded-xl border border-[#EAEAEA] p-8 ${toneClassMap[section.tone ?? "neutral"]}`}
              >
                <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-[#111111] md:text-[1.75rem]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-[0.96rem] leading-relaxed text-[#2F3437]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}
