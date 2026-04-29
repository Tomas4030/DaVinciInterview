import Link from "next/link";
import AdminAccountMenu from "@/components/admin/AdminAccountMenu";
import LocaleSelect from "@/components/home/LocaleSelect";
import { tInterview } from "@/lib/i18n/interview";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { CompanyRecord } from "@/lib/queries/companies";

type CompanyPublicHeaderProps = {
  company: CompanyRecord;
  locale?: string;
  adminEmail?: string;
};

function withLocale(path: string, locale: string): string {
  const safeLocale = normalizeLocale(locale);
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default function CompanyPublicHeader({
  company,
  locale = "en",
  adminEmail,
}: CompanyPublicHeaderProps) {
  const publicPageAria = tInterview(locale, "companyPublic.header.publicPageAria", {
    companyName: company.name,
  });
  const interviews = tInterview(locale, "companyPublic.header.interviews");
  const howItWorks = tInterview(locale, "companyPublic.header.howItWorks");

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href={withLocale(`/${company.slug}`, locale)}
          className="group flex items-center gap-2.5"
          aria-label={publicPageAria}
        >
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`Logo ${company.name}`}
              className="h-9 w-9 rounded-[8px] object-contain"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--c-brand)] text-[11px] font-bold text-white transition-transform duration-200 group-hover:scale-[1.06]">
              {company.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-[0.82rem] font-semibold tracking-tight text-[var(--c-text)]">
            {company.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#vagas"
            className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            {interviews}
          </a>
          <a
            href="#como-funciona"
            className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            {howItWorks}
          </a>
          <Link
            href={withLocale("/", locale)}
            className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            MatchWorky
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSelect
            locale={locale}
            ariaLabel={normalizeLocale(locale) === "pt" || normalizeLocale(locale) === "br" ? "Selecionar idioma" : "Select language"}
          />

          {adminEmail ? (
            <AdminAccountMenu
              userEmail={adminEmail}
              publicHref={withLocale(`/${company.slug}`, locale)}
              adminHref={withLocale(`/admin/${company.slug}/dashboard`, locale)}
              locale={locale}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
