type Props = {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
};

export default function MetricCard({ title, value, subtitle, delta }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-[24px] font-bold leading-none tracking-tight text-slate-950">
        {value}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta ? (
          <span className="font-semibold text-emerald-600">{delta}</span>
        ) : null}
        {subtitle ? <span className="text-slate-500">{subtitle}</span> : null}
      </div>
    </article>
  );
}
