"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  slug: string;
};

type Item = {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
};

const iconClassName = "h-[18px] w-[18px]";

const ITEMS: Item[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="3" y="4" width="18" height="14" rx="3" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
      </svg>
    ),
  },
  {
    key: "interviews",
    label: "Entrevistas",
    path: "interviews",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <path d="M8 10h8" />
        <path d="M8 14h5" />
        <rect x="4" y="3" width="16" height="18" rx="3" />
      </svg>
    ),
  },
  {
    key: "responses",
    label: "Respostas",
    path: "responses",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Definições",
    path: "settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2a1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9a1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1a1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6a1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
      </svg>
    ),
  },
  {
    key: "billing",
    label: "Faturação",
    path: "billing",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </svg>
    ),
  },
];

export default function AdminCompanySidebar({ slug }: Props) {
  const pathname = usePathname();
  const base = `/admin/${slug}`;

  return (
    <aside className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
      <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
        Navegação
      </p>

      <nav className="space-y-1.5" aria-label="Navegação da empresa">
        {ITEMS.map((item) => {
          const href = `${base}/${item.path}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                active
                  ? "bg-[#F3F4FF] font-medium text-[#1F2A44]"
                  : "text-[var(--c-muted)] hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]",
              ].join(" ")}
            >
              <span className={active ? "text-[#4F46E5]" : "text-current"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
