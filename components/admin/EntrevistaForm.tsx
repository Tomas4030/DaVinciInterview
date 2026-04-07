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
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {erro}
        </div>
      )}

      {/* ── Informação básica ── */}
      <div className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Informação básica</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ID */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              ID da vaga <span className="text-red-400">*</span>
            </label>
            <input
              value={vaga.id}
              onChange={e => setCampo('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              disabled={isEdicao}
              placeholder="ex: fullstack-senior"
              className="input-base font-mono disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Slug único — letras minúsculas, números e hífenes
            </p>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
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
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Descrição</label>
          <textarea
            value={vaga.descricao}
            onChange={e => setCampo('descricao', e.target.value)}
            rows={2}
            placeholder="Breve descrição da vaga…"
            className="input-base resize-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Modalidade */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Modalidade</label>
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
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
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
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Estado</label>
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

      {/* ── Perguntas ── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Perguntas
            <span className="ml-2 text-xs font-normal text-gray-400">({vaga.perguntas.length})</span>
          </h2>
        </div>

        <div className="space-y-3">
          {vaga.perguntas.map((pergunta, i) => (
            <div key={i} className="flex gap-2 items-start group/pergunta">
              {/* Número */}
              <span className="mt-3 text-xs text-gray-300 w-5 text-right flex-shrink-0 font-mono">
                {i + 1}
              </span>

              {/* Textarea */}
              <textarea
                value={pergunta.texto}
                onChange={e => atualizarPergunta(i, e.target.value)}
                rows={2}
                placeholder={`Pergunta ${i + 1}…`}
                className="input-base flex-1 resize-none"
              />

              {/* Controls */}
              <div className="flex flex-col gap-1 pt-1 opacity-0 group-hover/pergunta:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moverPergunta(i, 'up')}
                  disabled={i === 0}
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-0 transition-colors"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moverPergunta(i, 'down')}
                  disabled={i === vaga.perguntas.length - 1}
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-0 transition-colors"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                {vaga.perguntas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerPergunta(i)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={adicionarPergunta}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Adicionar pergunta
        </button>
      </div>

      {/* ── Acções ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                A guardar…
              </span>
            ) : saved ? '✓ Guardado!' : isEdicao ? 'Guardar alterações' : 'Criar entrevista'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="btn-ghost"
          >
            Cancelar
          </button>
        </div>

        {isEdicao && (
          <button
            type="button"
            onClick={handleApagar}
            disabled={loading}
            className={`text-sm px-4 py-2.5 rounded-xl border transition-all ${
              confirmApagar
                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
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
