type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type Props = {
  columns: Column[];
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function DataTable({ columns, children, footer }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 ${column.align === "right" ? "text-right" : "text-left"}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-slate-200 px-4 py-3">{footer}</div> : null}
    </div>
  );
}
