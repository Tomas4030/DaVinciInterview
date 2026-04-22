import { SearchIcon } from "../ui/Icons";

export default function EmptyState() {
  return (
    <div className="flex animate-reveal flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] px-8 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50/80 text-brand-500 ring-1 ring-brand-100/80">
        <SearchIcon />
      </div>

      <p className="font-medium text-[var(--c-text)]">
        Nenhuma vaga disponível de momento.
      </p>
      <p className="mt-1.5 text-sm text-[var(--c-text)]/60">
        Volta em breve ou contacta o recrutador.
      </p>
    </div>
  );
}
