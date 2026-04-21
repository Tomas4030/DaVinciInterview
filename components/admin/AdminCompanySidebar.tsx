"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  slug: string;
};

const ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "dashboard" },
  { key: "interviews", label: "Entrevistas", path: "interviews" },
  { key: "responses", label: "Respostas", path: "responses" },
  { key: "settings", label: "Definicoes", path: "settings" },
  { key: "billing", label: "Faturacao", path: "billing" },
];

export default function AdminCompanySidebar({ slug }: Props) {
  const pathname = usePathname();
  const base = `/admin/${slug}`;

  return (
    <aside className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-3">
      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--c-muted)]">
        Navegacao
      </p>

      <nav className="space-y-1" aria-label="Navegacao da empresa">
        {ITEMS.map((item) => {
          const href = `${base}/${item.path}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--c-bg)] font-medium text-[var(--c-text)]"
                  : "text-[var(--c-muted)] hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
