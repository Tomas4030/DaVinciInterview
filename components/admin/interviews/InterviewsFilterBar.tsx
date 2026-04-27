import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  searchTerm: string;
  statusFilter: string;
  locale?: string;
};

export default function InterviewsFilterBar({
  searchTerm,
  statusFilter,
  locale = "pt",
}: Props) {
  return (
    <form className="grid gap-3 rounded-[12px] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 md:grid-cols-[1fr,170px,auto]">
      <input
        type="text"
        name="q"
        defaultValue={searchTerm}
        placeholder={tAdmin(locale, "interviews.filters.searchPlaceholder")}
        className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
      />

      <select
        name="status"
        defaultValue={statusFilter}
        className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
      >
        <option value="all">{tAdmin(locale, "interviews.filters.statusAll")}</option>
        <option value="draft">{tAdmin(locale, "interviews.filters.statusDraft")}</option>
        <option value="published">{tAdmin(locale, "interviews.filters.statusPublished")}</option>
        <option value="archived">{tAdmin(locale, "interviews.filters.statusArchived")}</option>
      </select>

      <button
        type="submit"
        className="btn-primary inline-flex justify-center px-4 py-2"
      >
        {tAdmin(locale, "interviews.filters.submit")}
      </button>
    </form>
  );
}
