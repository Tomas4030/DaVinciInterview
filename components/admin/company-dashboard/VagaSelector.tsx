"use client";

import { useRouter } from "next/navigation";

interface VagaSelectorProps {
  vagas: { vagaId: string; vagaTitle: string }[];
  selectedVagaId?: string;
  slug: string;
  locale?: string;
}

export default function VagaSelector({
  vagas,
  selectedVagaId,
  slug,
  locale = "en",
}: VagaSelectorProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(
      `/${locale}/admin/${slug}/responses/ai-comparacao?vaga=${e.target.value}`,
    );
  }

  return (
    <div className="relative w-64">
      <select
        defaultValue={selectedVagaId || ""}
        onChange={handleChange}
        className="h-8 w-full appearance-none rounded-lg border border-[var(--c-border)]/70 bg-[var(--c-surface)] px-3 pr-8 text-sm text-[var(--c-text)] outline-none transition focus:border-[#4F46E5]/50 focus:ring-2 focus:ring-[#4F46E5]/10"
      >
        {vagas.map((vaga) => (
          <option key={vaga.vagaId} value={vaga.vagaId}>
            {vaga.vagaTitle}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[var(--c-muted)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
