import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  status: string;
  locale?: string;
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

function getStatusLabel(status: string, locale: string): string {
  if (status === "published") return tAdmin(locale, "interviews.filters.statusPublished");
  if (status === "draft") return tAdmin(locale, "interviews.filters.statusDraft");
  if (status === "archived") return tAdmin(locale, "interviews.filters.statusArchived");
  return status;
}

export default function InterviewStatusBadge({ status, locale = "en" }: Props) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] ${getStatusBadgeClass(status)}`}
    >
      {getStatusLabel(status, locale)}
    </span>
  );
}
