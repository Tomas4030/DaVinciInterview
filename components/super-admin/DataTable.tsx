type Column = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

type Props = {
  columns: Column[];
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function DataTable({ columns, children, footer }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#fbfbfa]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#787774] ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f1ef]">{children}</tbody>
        </table>
      </div>

      {footer ? (
        <div className="flex items-center justify-between border-t border-[#f1f1ef] px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
