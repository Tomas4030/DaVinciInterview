type Props = {
  tone?: "default" | "blue" | "green" | "red" | "purple" | "amber";
  children: React.ReactNode;
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-[#f3f3f2] text-[#787774]",
  blue: "bg-[#e1f3fe] text-[#1f6c9f]",
  green: "bg-[#edf3ec] text-[#346538]",
  red: "bg-[#fdebec] text-[#9f2f2d]",
  purple: "bg-[#ece8ff] text-[#5b46c5]",
  amber: "bg-[#fbf3db] text-[#956400]",
};

export default function StatusBadge({ tone = "default", children }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
