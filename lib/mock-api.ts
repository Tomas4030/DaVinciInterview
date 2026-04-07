// lib/mock-api.ts
import vagasData from "@/data/vagas.json";

export interface VagaFromMock {
  id: string;
  titulo: string;
  descricao: string;
  modalidade: "Remoto" | "Híbrido" | "Presencial";
  duracao_min: number;
  ativa: boolean;
  criada_em: string;
  perguntas: Array<{
    id: number;
    texto: string;
  }>;
}

export const getAllVagas = async (): Promise<VagaFromMock[]> => {
  // Simula delay de API
  await new Promise((resolve) => setTimeout(resolve, 100));

  return vagasData.vagas.filter((vaga) => vaga.ativa);
};

export const getVagaById = async (id: string): Promise<VagaFromMock | null> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const vaga = vagasData.vagas.find((v) => v.id === id);
  return vaga && vaga.ativa ? vaga : null;
};

export const addVaga = async (newVaga: VagaFromMock): Promise<void> => {
  // Em produção, isto seria guardado numa base de dados
  // Aqui apenas simula a adição
  vagasData.vagas.push(newVaga);
};
