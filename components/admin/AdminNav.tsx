'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const links = [
    { href: '/admin',           label: 'Dashboard',   icon: 'dashboard' },
    { href: '/admin/respostas', label: 'Respostas',   icon: 'respostas' },
  ]

  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--c-border)]/60 bg-[var(--c-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* left: brand + nav */}
        <div className="flex items-center gap-7">
          <Link href="/admin" className="flex items-center gap-2.5 group" aria-label="Admin">
            <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--c-brand)] text-white text-[11px] font-bold font-display shadow-[0_1px_3px_rgba(67,85,232,0.18)] transition-transform duration-200 group-hover:scale-[1.06]">
              D
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[0.82rem] font-semibold text-[var(--c-text)] tracking-tight">DaVinci</span>
              <span className="text-[9px] text-[var(--c-muted)] tracking-[0.04em] uppercase">Admin</span>
            </div>
          </Link>

          {/* tab nav */}
          <div className="flex items-center gap-1" role="navigation" aria-label="Navegação admin">
            {links.map(link => {
              const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-lg px-3 py-1.5 text-[0.78rem] font-medium transition-colors duration-150 ${
                    active
                      ? 'text-[var(--c-text)] bg-[var(--c-bg)]'
                      : 'text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)]/60'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* right: quick action + user */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors duration-150 hidden sm:block"
            aria-label="Ver site público"
          >
            Ver site
            <span className="opacity-40 ml-0.5">↗</span>
          </Link>

          <Link
            href="/admin/entrevistas/nova"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--c-brand)] px-3 py-[7px] text-[11px] font-semibold text-white shadow-[0_1px_2px_rgba(67,85,232,0.1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:shadow-[0_2px_6px_rgba(67,85,232,0.2)] active:scale-[0.98]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova entrevista
          </Link>

          <span className="mx-1 h-4 w-px bg-[var(--c-border)] hidden sm:block" aria-hidden="true" />

          <div className="hidden md:flex items-center gap-2 ml-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--c-bg)] text-[10px] font-semibold text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60" aria-hidden="true">
              {userEmail?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <span className="text-[11px] text-[var(--c-muted)] max-w-[100px] truncate">{userEmail}</span>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-[var(--c-border)]/80 px-2.5 py-1.5 text-[11px] text-[var(--c-muted)] hover:text-[var(--c-text)] hover:border-[var(--c-border)] transition-[color,border-color] duration-150"
            aria-label="Terminar sessão"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
