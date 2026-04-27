import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  status: string;
  locale?: string;
};

function getStatusBadgeClass(status: string): string {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "concluida") {
    return "border-[#EDF3EC] bg-[#EDF3EC] text-[#346538]";
  }
  if (normalized === "em_analise") {
    return "border-[#E1F3FE] bg-[#E1F3FE] text-[#1F6C9F]";
  }
  if (normalized === "rejeitada") {
    return "border-[#FDEBEC] bg-[#FDEBEC] text-[#9F2F2D]";
  }

  return "border-[#FBF3DB] bg-[#FBF3DB] text-[#956400]";
}

export default function ResponseStatusBadge({ status, locale = "en" }: Props) {
  const normalized = String(status || "").toLowerCase();
  const labelKey =
    normalized === "concluida"
      ? "responses.status.concluida"
      : normalized === "em_analise"
        ? "responses.status.em_analise"
        : normalized === "rejeitada"
          ? "responses.status.rejeitada"
          : "responses.status.em_progresso";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.05em] ${getStatusBadgeClass(status)}`}
    >
      {tAdmin(locale, labelKey)}
    </span>
  );
}
