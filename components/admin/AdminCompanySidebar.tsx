"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tAdmin } from "@/lib/i18n/admin";

type Props = {
  slug: string;
  role?: "owner" | "admin" | "viewer";
  locale?: string;
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
    key: "team",
    label: "Utilizadores",
    path: "team",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={iconClassName}
      >
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="11" r="2" />
        <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
        <path d="M14 18a3 3 0 0 1 6 0" />
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

export default function AdminCompanySidebar({
  slug,
  role = "viewer",
  locale = "en",
}: Props) {
  const pathname = usePathname();
  const base = `/${locale}/admin/${slug}`;
  const items = ITEMS.filter((item) => {
    if (item.key === "billing" && role === "viewer") return false;
    return true;
  }).map((item) => {
    if (item.key === "interviews") {
      return { ...item, label: tAdmin(locale, "sidebar.interviews") };
    }
    if (item.key === "responses") {
      return { ...item, label: tAdmin(locale, "sidebar.responses") };
    }
    if (item.key === "settings") {
      return { ...item, label: tAdmin(locale, "sidebar.settings") };
    }
    if (item.key === "team") {
      return { ...item, label: tAdmin(locale, "sidebar.team") };
    }
    if (item.key === "billing") {
      return { ...item, label: tAdmin(locale, "sidebar.billing") };
    }
    return item;
  });

  return (
    <aside className="rounded-[20px] border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-4">
      <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-muted)]">
        {tAdmin(locale, "sidebar.navigation")}
      </p>

      <nav
        className="space-y-1.5"
        aria-label={tAdmin(locale, "sidebar.companyNavigation")}
      >
        {items.map((item) => {
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
