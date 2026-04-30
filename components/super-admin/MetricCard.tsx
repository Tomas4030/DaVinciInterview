type Props = {
  title: string;
  value: string;
  subtitle?: string;
  delta?: string;
};

export default function MetricCard({ title, value, subtitle, delta }: Props) {
  return (
    <article className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <p className="text-xs font-medium uppercase tracking-[0.05em] text-[#787774]">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#111111]">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-2">
        {delta ? (
          <span className="text-xs font-semibold text-[#346538]">
            {delta}
          </span>
        ) : null}
        {subtitle ? (
          <span className="text-xs text-[#787774]">{subtitle}</span>
        ) : null}
      </div>
    </article>
  );
}
