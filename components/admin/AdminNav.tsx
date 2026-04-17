"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

type AdminNavProps = {
  userEmail: string;
};

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/respostas", label: "Respostas" },
];

export default function AdminNav({ userEmail }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();

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
      console.error("Erro ao terminar sessão:", error);
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_email");
      setDropdownOpen(false);
      router.push("/admin/login");
      router.refresh();
    }
  }

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
            href="/admin"
            aria-label="Painel de administração"
            className="group flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--c-brand)] text-[11px] font-bold text-white shadow-[0_1px_3px_rgba(67,85,232,0.2)] transition-transform duration-200 group-hover:scale-[1.05]">
              D
            </div>

            <div className="leading-tight">
              <p className="text-[0.82rem] font-semibold leading-none tracking-tight text-[var(--c-text)]">
                Chat2Work
              </p>
              <p className="mt-0.5 text-[10px] leading-none text-[var(--c-muted)]">
                Admin
              </p>
            </div>
          </Link>

          <span aria-hidden="true" className="h-4 w-px bg-[var(--c-border)]" />

          <div
            className="flex items-center gap-0.5"
            aria-label="Navegação administrativa"
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
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="Menu do utilizador"
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
                      Administrador
                    </p>
                  </div>
                </div>

                <div className="p-1">
                  <Link
                    href="/"
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
                    Ver site público
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
                    Terminar sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
