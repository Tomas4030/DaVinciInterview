import Link from "next/link";
import Image from "next/image";
import AdminAccountMenu from "@/components/admin/AdminAccountMenu";
import LocaleSelect from "@/components/home/LocaleSelect";
import { getAdminCompanyContextFromServerCookies } from "@/lib/admin-context";
import { tLanding } from "@/lib/i18n/landing";

type HeaderProps = {
  locale?: string;
};

const supportedLocales = new Set(["pt", "en"]);

function withLocale(path: string, locale: string): string {
  const safeLocale = supportedLocales.has(locale) ? locale : "en";
  if (path === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${path}`;
}

export default async function Header({ locale = "en" }: HeaderProps) {
  const adminContext = await getAdminCompanyContextFromServerCookies();
  const ariaHome = tLanding(locale, "header.ariaHome");
  const features = tLanding(locale, "header.features");
  const howItWorks = tLanding(locale, "header.howItWorks");
  const pricing = tLanding(locale, "header.pricing");
  const login = tLanding(locale, "header.login");
  const startFree = tLanding(locale, "header.startFree");
  const languageAria = tLanding(locale, "header.languageAria");

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={withLocale("/", locale)}
          className="group flex items-center gap-2.5"
          aria-label={ariaHome}
        >
          <div className="flex h-18 w-18 items-center justify-center rounded-[7px] transition-transform duration-200 group-hover:scale-[1.06] group-active:scale-[0.98] overflow-hidden">
            <Image
              src="/logo.webp"
              alt="Logo"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>
          <span className="text-[1rem] font-semibold tracking-tight text-[var(--c-text)]">
            MatchWorky
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#funcionalidades"
            className="text-[0.82rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            {features}
          </a>
          <a
            href="#como-funciona"
            className="text-[0.82rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            {howItWorks}
          </a>
          <a
            href="#pricing"
            className="text-[0.82rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            {pricing}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSelect locale={locale} ariaLabel={languageAria} />

          {adminContext ? (
            <AdminAccountMenu
              userEmail={adminContext.adminEmail}
              publicHref={withLocale(`/${adminContext.company.slug}`, locale)}
              adminHref={withLocale(
                `/admin/${adminContext.company.slug}/dashboard`,
                locale,
              )}
              locale={locale}
            />
          ) : (
            <>
              <Link
                href={withLocale("/admin/login", locale)}
                className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
              >
                {login}
              </Link>
              <Link
                href={withLocale("/plans", locale)}
                className="rounded-lg bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white shadow-[0_1px_3px_rgba(67,85,232,0.2)] transition-all hover:bg-[var(--c-brand-dark)] hover:shadow-[0_2px_8px_rgba(67,85,232,0.3)] active:scale-[0.97]"
              >
                {startFree}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
