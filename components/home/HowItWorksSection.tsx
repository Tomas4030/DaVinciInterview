import { HOW_IT_WORKS } from "./config";
import { IconGlobe, IconLayers, IconBuilding } from "./Icons";

const stepStyles = [
  {
    border: "border-blue-100",

    iconWrap: "bg-blue-600 text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    highlight: "Sem registo obrigatório",
  },
  {
    border: "border-slate-200",

    iconWrap: "bg-slate-900 text-white",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    highlight: "Completa ao teu ritmo",
  },
  {
    border: "border-blue-100",

    iconWrap: "bg-blue-600 text-white",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    highlight: "Envia em segundos",
  },
];

function StepIcon({ type, colorIdx }: { type: number; colorIdx: number }) {
  const icons = [
    <IconGlobe key="globe" />,
    <IconLayers key="layers" />,
    <IconBuilding key="building" />,
  ];

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${stepStyles[colorIdx].iconWrap}`}
      aria-hidden="false"
    >
      {icons[type]}
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden py-20 md:py-24"
      aria-label="Como funciona o processo"
    >
      {/* subtle background grid */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.06]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
              aria-hidden="true"
            />
            Processo simples e rápido
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Como funciona
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Em três passos, encontras uma vaga, respondes ao teu ritmo e
            submetes a candidatura sem complicações.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => {
            const style = stepStyles[i];

            return (
              <div
                key={item.num}
                className={`group relative rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-blue-500 ${style.border}`}
              >
                {/* top line accent */}
                <div
                  className="absolute left-8 top-0 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                  aria-hidden="true"
                />

                <div className="mb-6 flex items-center justify-between gap-4">
                  <StepIcon type={i} colorIdx={i} />
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${style.badge}`}
                  >
                    Passo {String(item.num).padStart(2, "0")}
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

                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-600">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-blue-600"
                    aria-hidden="true"
                  />
                  <span>{style.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
