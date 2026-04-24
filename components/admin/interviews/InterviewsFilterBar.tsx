type Props = {
  searchTerm: string;
  statusFilter: string;
};

export default function InterviewsFilterBar({ searchTerm, statusFilter }: Props) {
  return (
    <form className="grid gap-3 rounded-[12px] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 md:grid-cols-[1fr,170px,auto]">
      <input
        type="text"
        name="q"
        defaultValue={searchTerm}
        placeholder="Pesquisar por titulo ou descricao"
        className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
      />

      <select
        name="status"
        defaultValue={statusFilter}
        className="input-base border-[var(--c-border)] bg-[var(--c-bg)]"
      >
        <option value="all">Todos os estados</option>
        <option value="draft">Rascunho</option>
        <option value="published">Publicada</option>
        <option value="archived">Arquivada</option>
      </select>

      <button
        type="submit"
        className="btn-primary inline-flex justify-center px-4 py-2"
      >
        Filtrar
      </button>
    </form>
  );
}
