"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { tAdmin } from "@/lib/i18n/admin";

type AdminAccountMenuProps = {
  userEmail: string;
  publicHref: string;
  adminHref?: string;
  locale?: string;
};

export default function AdminAccountMenu({
  userEmail,
  publicHref,
  adminHref,
  locale = "en",
}: AdminAccountMenuProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initial = useMemo(() => {
    return userEmail?.trim()?.charAt(0)?.toUpperCase() || "U";
  }, [userEmail]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function logout() {
    try {
      await fetch(withBasePath("/api/auth/logout-admin"), { method: "POST" });
    } catch (error) {
      console.error(tAdmin(locale, "accountMenu.logoutError"), error);
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      setDropdownOpen(false);
      router.push(`/${locale}/admin/login`);
      router.refresh();
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((open) => !open)}
        aria-label={tAdmin(locale, "accountMenu.ariaLabel")}
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
        className={[
          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-150",
          dropdownOpen
            ? "border-[var(--c-brand)]/30 bg-[var(--c-bg)]"
            : "border-[var(--c-border)]/70 bg-transparent hover:border-[var(--c-border)] hover:bg-[var(--c-bg)]",
        ].join(" ")}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--c-brand)]/10 text-[10px] font-bold text-[var(--c-brand)]">
          {initial}
        </div>

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[var(--c-muted)] transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {dropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] shadow-[0_4px_20px_rgba(0,0,0,0.08)] animate-reveal"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--c-border)]/50 px-3.5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand)]/10 text-[11px] font-bold text-[var(--c-brand)]">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[var(--c-text)]">
                {userEmail}
              </p>
              <p className="text-[10px] text-[var(--c-muted)]">
                {tAdmin(locale, "accountMenu.adminRole")}
              </p>
            </div>
          </div>

          <div className="p-1">
            {adminHref ? (
              <Link
                href={adminHref}
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.78rem] text-[var(--c-muted)] transition-colors duration-150 hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                {tAdmin(locale, "accountMenu.viewAdmin")}
              </Link>
            ) : null}

            <Link
              href={publicHref}
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.78rem] text-[var(--c-muted)] transition-colors duration-150 hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {tAdmin(locale, "accountMenu.viewPublic")}
            </Link>

            <div className="my-1 border-t border-[var(--c-border)]/40" />

            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.78rem] text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {tAdmin(locale, "accountMenu.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
