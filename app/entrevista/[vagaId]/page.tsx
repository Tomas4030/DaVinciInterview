// app/entrevista/[vagaId]/page.tsx
import { notFound } from 'next/navigation'
import { obterVaga } from '@/lib/api'
import ChatEntrevista from '@/components/chat/ChatEntrevista'
import type { Metadata } from 'next'

interface Props { params: { vagaId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const vaga = await obterVaga(params.vagaId)
    return { title: `Entrevista — ${vaga.titulo}` }
  } catch {
    return { title: 'Entrevista' }
  }
}

export default async function EntrevistaPage({ params }: Props) {
  let vaga
  try {
    vaga = await obterVaga(params.vagaId)
  } catch {
    notFound()
  }

  if (!vaga.ativa) notFound()

  return <ChatEntrevista vaga={vaga} />
}
