type Props = {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
};

export default function MetricCard({ title, value, subtitle, delta }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {delta ? <span className="text-xs font-semibold text-emerald-600">{delta}</span> : null}
        {subtitle ? <span className="text-xs text-slate-500">{subtitle}</span> : null}
      </div>
    </article>
  );
}
