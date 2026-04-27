"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LocaleSelectProps = {
  locale: string;
  ariaLabel: string;
};

const SUPPORTED_LOCALES = new Set(["pt", "en"]);

const LOCALE_LABELS: Record<string, string> = {
  pt: "PT",
  en: "EN",
};

function toLocalizedPath(pathname: string, targetLocale: string): string {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) {
    return `/${targetLocale}`;
  }

  if (SUPPORTED_LOCALES.has(parts[0])) {
    parts[0] = targetLocale;
    return `/${parts.join("/")}`;
  }

  return `/${targetLocale}/${parts.join("/")}`;
}

export default function LocaleSelect({ locale, ariaLabel }: LocaleSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentLocale = SUPPORTED_LOCALES.has(locale) ? locale : "en";

  const queryString = useMemo(() => {
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }, [searchParams]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function changeLocale(nextLocale: string) {
    if (!SUPPORTED_LOCALES.has(nextLocale) || nextLocale === currentLocale) {
      setOpen(false);
      return;
    }

    const nextPath = toLocalizedPath(pathname || "/", nextLocale);
    setOpen(false);
    router.push(`${nextPath}${queryString}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 text-[0.76rem] font-semibold text-[var(--c-text)] transition-colors hover:border-[var(--c-border)]/80"
      >
        <span>{LOCALE_LABELS[currentLocale]}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[68px] overflow-hidden rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-1 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
        >
          {(Object.keys(LOCALE_LABELS) as Array<keyof typeof LOCALE_LABELS>).map(
            (item) => {
              const active = item === currentLocale;

              return (
                <button
                  key={item}
                  type="button"
                  role="menuitem"
                  onClick={() => changeLocale(item)}
                  className={[
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[0.75rem] font-medium transition-colors",
                    active
                      ? "bg-[var(--c-brand)]/10 text-[var(--c-brand)]"
                      : "text-[var(--c-text)] hover:bg-[var(--c-bg)]",
                  ].join(" ")}
                >
                  {LOCALE_LABELS[item]}
                  {active ? <span>•</span> : null}
                </button>
              );
            },
          )}
        </div>
      ) : null}
    </div>
  );
}
