import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries/companies";
import { getInterviewById } from "@/lib/queries/interviews";
import { IconArrowRight, IconShield } from "@/components/ui/Icons";

type Props = {
  params: { slug: string; interviewId: string };
};

const steps = [
  {
    title: "Revisão do perfil",
    description:
      "A equipa de recrutamento analisa as tuas respostas e histórico.",
  },
  {
    title: "Contacto por e-mail ou telefone",
    description:
      "Recebes uma mensagem com o resultado e, se avançares, os detalhes seguintes.",
  },
  {
    title: "Entrevista presencial ou videochamada",
    description: "A fase final do processo de seleção com a equipa.",
  },
];

export default async function InterviewDonePage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug);
  if (!company || company.subscription_status === "canceled") notFound();

  const interview = await getInterviewById(params.interviewId, company.id);
  if (!interview) notFound();

  return (
    <main className="flex min-h-screen items-start justify-center bg-[var(--c-bg)] px-6 py-12">
      <div className="w-full max-w-[560px] rounded-[28px] border border-black/5 bg-white/95 p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="mb-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--c-muted)]">
                  Entrevista concluída
                </p>
                <h1 className="text-[20px] font-semibold leading-snug text-[var(--c-text)]">
                  Obrigado pela tua candidatura
                </h1>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-4">
              <p className="mb-1 text-[11px] uppercase tracking-[0.07em] text-[var(--c-muted)]">
                Posição
              </p>
              <p className="text-[15px] font-medium text-[var(--c-text)]">
                {interview.title}
              </p>
            </div>
          </div>

          {/* Body text */}
          <div className="mb-10">
            <p className="text-[14px] leading-relaxed text-[var(--c-muted)]">
              Recebemos as tuas respostas e a equipa da{" "}
              <strong className="font-medium text-[var(--c-text)]">
                {company.name}
              </strong>{" "}
              vai rever o teu perfil em breve.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--c-muted)]">
              Se fores selecionado para a próxima fase, vais receber contacto
              com os próximos passos.
            </p>
          </div>

          {/* Steps timeline */}
          <div className="mb-10">
            <p className="mb-4 text-[11px] uppercase tracking-[0.08em] text-[var(--c-muted)]">
              O que acontece a seguir
            </p>

            <div className="flex flex-col">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  {/* Line + number */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] text-[11px] font-medium text-[var(--c-muted)]">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-[var(--c-border)]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={i < steps.length - 1 ? "pb-6 pt-1" : "pt-1"}>
                    <p className="text-[14px] font-medium text-[var(--c-text)]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--c-muted)]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="mb-8 flex flex-col gap-2.5">
            <Link
              href={`/${company.slug}`}
              className="btn-primary group flex w-full items-center justify-center gap-2 text-[12px] uppercase tracking-[0.06em]"
            >
              Ir para início
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                <IconArrowRight />
              </span>
            </Link>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[var(--c-muted)]">
            <IconShield />
            <p className="text-[11px] tracking-wide">
              Os teus dados estão protegidos e nunca serão partilhados.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
