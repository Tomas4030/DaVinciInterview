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
    { href: '/admin',           label: 'Dashboard' },
    { href: '/admin/respostas', label: 'Respostas' },
  ]

  return (
    <nav className="bg-white border-b border-[var(--c-border)] sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-13 flex items-center justify-between" style={{ height: 52 }}>
        {/* Logo + links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">D</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 hidden sm:block">DaVinci Admin</span>
          </div>

          <div className="flex items-center gap-1">
            {links.map(link => {
              const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? 'text-brand-700 bg-brand-50 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* User + actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors hidden sm:block"
          >
            Ver site ↗
          </Link>
          <Link
            href="/admin/entrevistas/nova"
            className="btn-primary py-1.5 px-3 text-xs hidden sm:inline-flex"
          >
            + Nova
          </Link>
          <div className="flex items-center gap-2 border-l border-gray-100 pl-3 ml-1">
            <span className="text-xs text-gray-400 max-w-[120px] truncate hidden md:block">{userEmail}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
