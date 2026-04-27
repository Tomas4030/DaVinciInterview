import { IconGlobe, IconLayers, IconBuilding } from "@/components/ui/Icons";
import { tInterview, tInterviewObject } from "@/lib/i18n/interview";

type CompanyStep = {
  num: string;
  title: string;
  desc: string;
  highlight: string;
};

const stepStyles = [
  {
    border: "border-blue-100",
    iconWrap: "bg-blue-600 text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    highlightColor: "text-blue-600",
    dot: "bg-blue-600",
  },
  {
    border: "border-slate-200",
    iconWrap: "bg-slate-900 text-white",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    highlightColor: "text-slate-700",
    dot: "bg-slate-900",
  },
  {
    border: "border-blue-100",
    iconWrap: "bg-blue-600 text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    highlightColor: "text-blue-600",
    dot: "bg-blue-600",
  },
];

function StepIcon({ index }: { index: number }) {
  const icons = [
    <IconGlobe key="globe" />,
    <IconLayers key="layers" />,
    <IconBuilding key="building" />,
  ];

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${stepStyles[index].iconWrap}`}
      aria-hidden="true"
    >
      {icons[index]}
    </div>
  );
}

type CompanyHowItWorksSectionProps = {
  locale?: string;
};

export default function CompanyHowItWorksSection({
  locale = "en",
}: CompanyHowItWorksSectionProps) {
  const ariaLabel = tInterview(locale, "companyPublic.howItWorks.ariaLabel");
  const badge = tInterview(locale, "companyPublic.howItWorks.badge");
  const title = tInterview(locale, "companyPublic.howItWorks.title");
  const description = tInterview(locale, "companyPublic.howItWorks.description");
  const stepLabel = tInterview(locale, "companyPublic.howItWorks.stepLabel");
  const steps = tInterviewObject<CompanyStep[]>(locale, "companyPublic.howItWorks.steps");

  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden py-20 md:py-24"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.06]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
              aria-hidden="true"
            />
            {badge}
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((item, index) => {
            const style = stepStyles[index];

            return (
              <article
                key={item.num}
                className={`group relative rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg ${style.border}`}
              >
                <div
                  className="absolute left-8 top-0 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                  aria-hidden="true"
                />

                <div className="mb-6 flex items-center justify-between gap-4">
                  <StepIcon index={index} />

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${style.badge}`}
                  >
                    {stepLabel} {item.num.padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="text-sm leading-7 text-slate-600">{item.desc}</p>

                <div
                  className="mt-6 h-px w-full bg-slate-100"
                  aria-hidden="true"
                />

                <div
                  className={`mt-5 flex items-center gap-2 text-sm font-medium ${style.highlightColor}`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                    aria-hidden="true"
                  />
                  <span>{item.highlight}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
