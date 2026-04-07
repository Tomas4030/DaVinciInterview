// app/admin/login/page.tsx
import LoginForm from '@/components/admin/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Entrar' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--c-bg)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
            <span className="text-white text-xl font-bold font-display">D</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">DaVinci Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Entra na tua conta para gerir entrevistas</p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
