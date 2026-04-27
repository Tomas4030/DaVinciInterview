"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import AdminAccountMenu from "@/components/admin/AdminAccountMenu";
import { tAdmin } from "@/lib/i18n/admin";

type AdminNavProps = {
  userEmail: string;
  companySlug?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  locale?: string;
};

export default function AdminNav({
  userEmail,
  companySlug,
  companyName,
  companyLogoUrl,
  locale = "pt",
}: AdminNavProps) {
  const pathname = usePathname();

  const adminBasePath = companySlug ? `/admin/${companySlug}` : "/admin";

  const NAV_LINKS = companySlug
    ? [{ href: `${adminBasePath}/dashboard`, label: tAdmin(locale, "nav.dashboard") }]
    : [
        { href: adminBasePath, label: tAdmin(locale, "nav.dashboard") },
        { href: `${adminBasePath}/respostas`, label: tAdmin(locale, "nav.responses") },
      ];

  const companyInitial = useMemo(() => {
    const baseName = String(companyName || "").trim();
    return baseName ? baseName.charAt(0).toUpperCase() : "D";
  }, [companyName]);

  function isActive(href: string) {
    return (
      pathname === href || (href !== "/admin" && pathname.startsWith(href))
    );
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-7">
          <Link
            href={companySlug ? `${adminBasePath}/dashboard` : "/admin"}
            aria-label={tAdmin(locale, "nav.ariaLabel")}
            className="group flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[8px] text-[12px] font-bold text-[var(--c-text)] transition-transform duration-200 group-hover:scale-[1.05]">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={`Logo ${companyName || "empresa"}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-[8px] bg-[var(--c-bg)]">
                  {companyInitial}
                </span>
              )}
            </div>

            <div className="leading-tight">
              <p className="text-[0.82rem] font-semibold leading-none tracking-tight text-[var(--c-text)]">
                {companyName || "MatchWorky"}
              </p>
              <p className="mt-0.5 text-[10px] leading-none text-[var(--c-muted)]">
                {tAdmin(locale, "nav.adminBadge")}
              </p>
            </div>
          </Link>

          <span aria-hidden="true" className="h-4 w-px bg-[var(--c-border)]" />

          <div
            className="flex items-center gap-0.5"
            aria-label={tAdmin(locale, "nav.navigationLabel")}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-lg px-3 py-1.5 text-[0.8rem] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--c-bg)] text-[var(--c-text)]"
                      : "text-[var(--c-muted)] hover:bg-[var(--c-bg)]/60 hover:text-[var(--c-text)]",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AdminAccountMenu
            userEmail={userEmail}
            publicHref={companySlug ? `/${companySlug}` : "/"}
          />
        </div>
      </div>
    </nav>
  );
}
