type Props = {
  title: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export default function ChartCard({ title, children, rightSlot }: Props) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#2f3437]">{title}</h3>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}
