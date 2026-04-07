import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-display text-brand-600 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-gray-500 text-sm mb-6">O conteúdo que procuras não existe ou foi removido.</p>
        <Link href="/" className="btn-primary">← Voltar ao início</Link>
      </div>
    </main>
  )
}
