// app/admin/page.tsx
import Link from 'next/link'
import { listarVagas, contarRespostas } from '@/lib/api'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Dashboard' }

const MODALIDADE_STYLE: Record<string, string> = {
  Remoto:     'bg-blue-50 text-blue-700',
  Híbrido:    'bg-violet-50 text-violet-700',
  Presencial: 'bg-emerald-50 text-emerald-700',
}

export default async function AdminPage() {
  let vagas: Awaited<ReturnType<typeof listarVagas>> = []
  let totalRespostas = 0

  try { vagas = await listarVagas() }            catch {}
  try { totalRespostas = await contarRespostas() } catch {}

  const totalPerguntas = vagas.reduce((acc, v) => acc + v.total_perguntas, 0)
  const vagasAtivas    = vagas.filter(v => v.ativa).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Gere entrevistas e consulta candidaturas</p>
        </div>
        <Link href="/admin/entrevistas/nova" className="btn-primary">
          + Nova entrevista
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Entrevistas',       value: vagas.length,     sub: `${vagasAtivas} ativas` },
          { label: 'Total de perguntas', value: totalPerguntas,  sub: 'em todas as vagas' },
          { label: 'Respostas',          value: totalRespostas,  sub: 'candidaturas recebidas' },
          { label: 'Taxa média',         value: vagas.length > 0 ? `${Math.round(totalRespostas / vagas.length)}` : '—', sub: 'respostas por vaga' },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Entrevistas table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Entrevistas</h2>
          <span className="text-xs text-gray-400">{vagas.length} no total</span>
        </div>

        {vagas.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-gray-400 text-sm">Nenhuma entrevista criada.</p>
            <Link href="/admin/entrevistas/nova" className="text-brand-600 text-sm hover:underline mt-1 inline-block">
              Criar a primeira →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {vagas.map(vaga => (
              <div key={vaga.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors group">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{vaga.titulo}</p>
                    {!vaga.ativa && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-medium">
                        inativa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{vaga.id}</p>
                </div>

                {/* Modalidade */}
                <span className={`tag hidden sm:inline-flex ${MODALIDADE_STYLE[vaga.modalidade] ?? 'bg-gray-50 text-gray-500'}`}>
                  {vaga.modalidade}
                </span>

                {/* Perguntas */}
                <span className="text-sm text-gray-400 tabular-nums hidden md:block w-24 text-right">
                  {vaga.total_perguntas} pergunta{vaga.total_perguntas !== 1 ? 's' : ''}
                </span>

                {/* Acções */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/entrevistas/${vaga.id}`}
                    className="btn-ghost py-1.5 px-3 text-xs"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/admin/respostas?vaga=${vaga.id}`}
                    className="btn-ghost py-1.5 px-3 text-xs"
                  >
                    Respostas
                  </Link>
                  <Link
                    href={`/entrevista/${vaga.id}`}
                    target="_blank"
                    className="text-xs text-gray-300 hover:text-brand-600 px-1 transition-colors"
                    title="Pré-visualizar"
                  >
                    ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
