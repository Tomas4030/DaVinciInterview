import Link from "next/link";
import Image from "next/image";
import AdminAccountMenu from "@/components/admin/AdminAccountMenu";
import { getAdminCompanyContextFromServerCookies } from "@/lib/admin-context";

export default async function Header() {
  const adminContext = await getAdminCompanyContextFromServerCookies();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="Página inicial — MatchWorky"
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
            Funcionalidades
          </a>
          <a
            href="#como-funciona"
            className="text-[0.82rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            Como funciona
          </a>
          <a
            href="#pricing"
            className="text-[0.82rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
          >
            Preços
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {adminContext ? (
            <AdminAccountMenu
              userEmail={adminContext.adminEmail}
              publicHref={`/${adminContext.company.slug}`}
              adminHref={`/admin/${adminContext.company.slug}/dashboard`}
            />
          ) : (
            <>
              <Link
                href="/admin/login"
                className="text-[0.8rem] font-medium text-[var(--c-text)]/65 transition-colors hover:text-[var(--c-text)]"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[var(--c-brand)] px-4 py-2 text-[0.78rem] font-semibold text-white shadow-[0_1px_3px_rgba(67,85,232,0.2)] transition-all hover:bg-[var(--c-brand-dark)] hover:shadow-[0_2px_8px_rgba(67,85,232,0.3)] active:scale-[0.97]"
              >
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
