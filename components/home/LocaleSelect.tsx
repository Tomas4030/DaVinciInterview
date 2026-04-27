"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LocaleSelectProps = {
  locale: string;
  ariaLabel: string;
};

const SUPPORTED_LOCALES = new Set(["pt", "en"]);

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

  const currentLocale = SUPPORTED_LOCALES.has(locale) ? locale : "en";

  const queryString = useMemo(() => {
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }, [searchParams]);

  return (
    <select
      value={currentLocale}
      onChange={(event) => {
        const nextLocale = event.target.value;
        if (!SUPPORTED_LOCALES.has(nextLocale)) {
          return;
        }

        const nextPath = toLocalizedPath(pathname || "/", nextLocale);
        router.push(`${nextPath}${queryString}`);
      }}
      aria-label={ariaLabel}
      className="h-9 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 text-[0.76rem] font-medium text-[var(--c-text)] outline-none transition-colors hover:border-[var(--c-border)]/80"
    >
      <option value="pt">PT</option>
      <option value="en">EN</option>
    </select>
  );
}
