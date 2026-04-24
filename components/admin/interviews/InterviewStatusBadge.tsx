type Props = {
  status: string;
};

function getStatusBadgeClass(status: string): string {
  if (status === "published") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "draft") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "archived") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getStatusLabel(status: string): string {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  if (status === "archived") return "Arquivado";
  return status;
}

export default function InterviewStatusBadge({ status }: Props) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] ${getStatusBadgeClass(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
