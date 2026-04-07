// app/page.tsx
import Link from 'next/link'
import { listarVagasAtivas, VagaResumo } from '@/lib/api'

const MODALIDADE_STYLE: Record<string, string> = {
  Remoto:      'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  Híbrido:     'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  Presencial:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
}

const MODALIDADE_DOT: Record<string, string> = {
  Remoto:     'bg-blue-500',
  Híbrido:    'bg-violet-500',
  Presencial: 'bg-emerald-500',
}

function VagaCard({ vaga }: { vaga: VagaResumo }) {
  const tagStyle = MODALIDADE_STYLE[vaga.modalidade] ?? 'bg-gray-50 text-gray-700 ring-1 ring-gray-100'
  const dotStyle = MODALIDADE_DOT[vaga.modalidade] ?? 'bg-gray-400'

  return (
    <div className="card p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <span className={`tag ${tagStyle} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
          {vaga.modalidade}
        </span>
        <span className="text-xs text-gray-400 mt-0.5 tabular-nums">
          ~{vaga.duracao_min} min
        </span>
      </div>

      <div className="flex-1">
        <h2 className="text-base font-semibold text-gray-900 mb-1.5 leading-snug">
          {vaga.titulo}
        </h2>
        {vaga.descricao && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {vaga.descricao}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {vaga.total_perguntas} pergunta{vaga.total_perguntas !== 1 ? 's' : ''}
        </span>
        <Link
          href={`/entrevista/${vaga.id}`}
          className="btn-primary py-1.5 px-3 text-xs group-hover:gap-2"
        >
          Iniciar
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  )
}

export default async function HomePage() {
  let vagas: VagaResumo[] = []
  try {
    vagas = await listarVagasAtivas()
  } catch {
    // Supabase pode não estar configurado ainda
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[var(--c-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">D</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">DaVinci Interviews</span>
          </div>
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Área admin →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full mb-5 ring-1 ring-brand-100">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Entrevistas abertas
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-gray-900 mb-4 leading-tight">
          Candidata-te à tua<br />
          <em className="not-italic text-brand-600">próxima oportunidade</em>
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Escolhe a vaga, responde ao teu ritmo. Sem conta, sem espera.
        </p>
      </section>

      {/* Grid de vagas */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        {vagas.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">Nenhuma vaga disponível de momento.</p>
            <p className="text-sm text-gray-400 mt-1">
              Volta em breve ou contacta o recrutador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vagas.map((vaga, i) => (
              <div
                key={vaga.id}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <VagaCard vaga={vaga} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
