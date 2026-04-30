type Props = {
  title: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export default function ChartCard({ title, children, rightSlot }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}
