'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Vaga, Pergunta } from '@/lib/api'

interface Props { vagaInicial?: Vaga }

const VAGA_VAZIA: Vaga = {
  id:         '',
  titulo:     '',
  descricao:  '',
  modalidade: 'Remoto',
  duracao_min: 10,
  perguntas:  [{ id: 1, texto: '', tipo: 'aberta' }],
  ativa:      true,
}

export default function EntrevistaForm({ vagaInicial }: Props) {
  const router   = useRouter()
  const isEdicao = !!vagaInicial

  const [vaga,          setVaga]          = useState<Vaga>(vagaInicial ?? VAGA_VAZIA)
  const [loading,       setLoading]       = useState(false)
  const [erro,          setErro]          = useState('')
  const [confirmApagar, setConfirmApagar] = useState(false)
  const [saved,         setSaved]         = useState(false)

  function setCampo<K extends keyof Vaga>(campo: K, valor: Vaga[K]) {
    setVaga(prev => ({ ...prev, [campo]: valor }))
    setSaved(false)
  }

  function adicionarPergunta() {
    const novoId = vaga.perguntas.length + 1
    setVaga(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { id: novoId, texto: '', tipo: 'aberta' }],
    }))
  }

  function removerPergunta(index: number) {
    setVaga(prev => ({
      ...prev,
      perguntas: prev.perguntas
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, id: i + 1 })),
    }))
  }

  function moverPergunta(index: number, direcao: 'up' | 'down') {
    const arr = [...vaga.perguntas]
    const destino = direcao === 'up' ? index - 1 : index + 1
    if (destino < 0 || destino >= arr.length) return
    ;[arr[index], arr[destino]] = [arr[destino], arr[index]]
    setVaga(prev => ({ ...prev, perguntas: arr.map((p, i) => ({ ...p, id: i + 1 })) }))
  }

  function atualizarPergunta(index: number, texto: string) {
    setVaga(prev => ({
      ...prev,
      perguntas: prev.perguntas.map((p, i) => i === index ? { ...p, texto } : p),
    }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!vaga.id.trim())                                      return setErro('O ID da vaga é obrigatório.')
    if (!vaga.titulo.trim())                                  return setErro('O título é obrigatório.')
    if (vaga.perguntas.some(p => !p.texto.trim()))            return setErro('Todas as perguntas devem ter texto.')
    if (!/^[a-z0-9-]+$/.test(vaga.id))                      return setErro('O ID só pode ter letras minúsculas, números e hífenes.')

    setLoading(true)
    try {
      const url    = isEdicao ? `/api/vagas/${vaga.id}` : '/api/vagas'
      const method = isEdicao ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaga),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erro ao guardar')
      }

      setSaved(true)
      setTimeout(() => router.push('/admin'), 800)
      router.refresh()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  async function handleApagar() {
    if (!confirmApagar) { setConfirmApagar(true); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/vagas/${vaga.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao apagar')
      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao apagar')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {erro && (
        <div className="relative rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-600">
          {erro}
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
          Guardado com sucesso. A voltar ao dashboard…
        </div>
      )}

      {/* ── Informação básica ── */}
      <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-6">
        <h2 className="mb-5 text-[0.82rem] font-semibold text-[var(--c-text)] tracking-tight">Informação básica</h2>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ID */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">
                ID da vaga <span className="text-red-400">*</span>
              </label>
              <input
                value={vaga.id}
                onChange={e => setCampo('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                disabled={isEdicao}
                placeholder="ex: fullstack-senior"
                className="input-base font-mono disabled:bg-[var(--c-bg)] disabled:text-[var(--c-muted)] disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-[var(--c-muted)]">
                Slug único — letras minúsculas, números e hífenes
              </p>
            </div>

            {/* Título */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                value={vaga.titulo}
                onChange={e => setCampo('titulo', e.target.value)}
                placeholder="ex: Programador Full-Stack"
                className="input-base"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">Descrição</label>
            <textarea
              value={vaga.descricao}
              onChange={e => setCampo('descricao', e.target.value)}
              rows={2}
              placeholder="Breve descrição da vaga…"
              className="input-base resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {/* Modalidade */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">Modalidade</label>
              <select
                value={vaga.modalidade}
                onChange={e => setCampo('modalidade', e.target.value)}
                className="input-base"
              >
                <option>Remoto</option>
                <option>Híbrido</option>
                <option>Presencial</option>
              </select>
            </div>

            {/* Duração */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">
                Duração (min)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={vaga.duracao_min}
                onChange={e => setCampo('duracao_min', Number(e.target.value))}
                className="input-base"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--c-muted)] uppercase tracking-[0.03em]">Estado</label>
              <select
                value={vaga.ativa ? 'ativa' : 'inativa'}
                onChange={e => setCampo('ativa', e.target.value === 'ativa')}
                className="input-base"
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Perguntas ── */}
      <section className="rounded-xl border border-[var(--c-border)]/70 bg-[var(--c-surface)] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[0.82rem] font-semibold text-[var(--c-text)] tracking-tight">
            Perguntas
            <span className="ml-2 font-normal text-[var(--c-muted)] text-xs">{vaga.perguntas.length}</span>
          </h2>
          <button
            type="button"
            onClick={adicionarPergunta}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--c-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)]/80 ring-1 ring-[var(--c-border)]/60 transition-[color,background-color] duration-150"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {vaga.perguntas.map((pergunta, i) => (
            <div key={i} className="group/pergunta flex items-start gap-3 animate-reveal" style={{ animationDelay: `${i * 30}ms` }}>
              {/* number */}
              <span className="mt-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[var(--c-bg)] text-[9px] font-bold text-[var(--c-muted)] ring-1 ring-[var(--c-border)]/60 tabular-nums">
                {i + 1}
              </span>

              {/* textarea */}
              <textarea
                value={pergunta.texto}
                onChange={e => atualizarPergunta(i, e.target.value)}
                rows={2}
                placeholder={`Pergunta ${i + 1}…`}
                className="input-base flex-1 resize-none"
              />

              {/* controls — visible on hover */}
              <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover/pergunta:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  onClick={() => moverPergunta(i, 'up')}
                  disabled={i === 0}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] disabled:opacity-0 transition-[color,opacity] text-[10px]"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverPergunta(i, 'down')}
                  disabled={i === vaga.perguntas.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] disabled:opacity-0 transition-[color,opacity] text-[10px]"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                {vaga.perguntas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerPergunta(i)}
                    className="flex h-6 w-6 items-center justify-center rounded text-[var(--c-muted)] hover:text-red-500 hover:bg-red-50 transition-[color,background-color] text-[11px]"
                    title="Remover"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Acções ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`
              inline-flex items-center gap-2 rounded-xl px-4 py-[9px] text-[0.78rem] font-semibold text-white
              transition-[transform,box-shadow,background-color] duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.985]
              ${saved
                ? 'bg-emerald-600 shadow-[0_1px_2px_rgba(16,185,129,0.1)]'
                : 'bg-[var(--c-brand)] shadow-[0_1px_2px_rgba(67,85,232,0.1)] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(67,85,232,0.22)]'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                A guardar…
              </>
            ) : saved ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Guardado!
              </>
            ) : isEdicao ? 'Guardar alterações' : 'Criar entrevista'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="rounded-xl border border-[var(--c-border)]/80 px-4 py-[9px] text-[0.78rem] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] hover:border-[var(--c-border)] transition-[color,border-color] duration-150"
          >
            Cancelar
          </button>
        </div>

        {isEdicao && (
          <button
            type="button"
            onClick={handleApagar}
            disabled={loading}
            className={`text-[0.72rem] font-medium rounded-xl border px-4 py-[9px] transition-all duration-200 ${
              confirmApagar
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-[0_1px_2px_rgba(220,38,38,0.15)]'
                : 'text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200'
            }`}
          >
            {confirmApagar ? 'Confirmar eliminação' : 'Eliminar vaga'}
          </button>
        )}
      </div>
    </form>
  )
}
