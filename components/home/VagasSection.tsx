import VagaCard from "./VagaCard";
import EmptyState from "./EmptyState";
import type { VagaResumo } from "@/lib/api";

function getPosicoesLabel(count: number) {
  if (count === 0) return "Sem posições disponíveis de momento";
  return `${count} posiç${count === 1 ? "ão" : "ões"} disponívei${count === 1 ? "l" : "s"}`;
}

export default function VagasSection({ vagas }: { vagas: VagaResumo[] }) {
  const vagasCount = vagas.length;

  return (
    <section id="vagas" className="relative mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-10 flex items-end gap-6">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-tight text-[var(--c-text)]">
            Vagas abertas
          </h2>
          <p className="mt-1 text-[0.82rem] text-[var(--c-text)]/55">
            {getPosicoesLabel(vagasCount)}
          </p>
        </div>
      </div>

      {vagasCount === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {vagas.map((vaga, index) => (
            <VagaCard key={vaga.id} vaga={vaga} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
