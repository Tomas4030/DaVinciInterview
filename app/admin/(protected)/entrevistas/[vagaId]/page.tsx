// app/admin/(protected)/entrevistas/[vagaId]/page.tsx
import { notFound } from "next/navigation";
import { obterVaga } from "@/lib/api";
import EntrevistaForm from "@/components/admin/EntrevistaForm";
import type { Metadata } from "next";

interface Props {
  params: { vagaId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const vaga = await obterVaga(params.vagaId);
    return { title: `Admin — Editar ${vaga.titulo}` };
  } catch {
    return { title: "Admin — Editar entrevista" };
  }
}

export default async function EditarEntrevistaPage({ params }: Props) {
  let vaga;
  try {
    vaga = await obterVaga(params.vagaId);
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Editar entrevista
        </h1>
        <p className="text-sm text-gray-500 mt-1">{vaga.titulo}</p>
      </div>
      <EntrevistaForm vagaInicial={vaga} />
    </div>
  );
}
