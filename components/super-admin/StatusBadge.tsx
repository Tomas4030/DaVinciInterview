type Props = {
  tone?: "default" | "blue" | "green" | "red" | "purple" | "amber";
  children: React.ReactNode;
};

const TONE_CLASS: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-gray-100 text-gray-700",
  blue: "bg-indigo-100 text-indigo-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  purple: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
};

export default function StatusBadge({ tone = "default", children }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
