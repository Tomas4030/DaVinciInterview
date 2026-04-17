// lib/mock-api.ts
// Comunicação com MockAPI (https://mockapi.io)
// Fonte de verdade: perguntas de vagas armazenadas na MockAPI

const MOCKAPI_ENDPOINT = process.env.MOCKAPI_ENDPOINT;

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
  try {
    if (!MOCKAPI_ENDPOINT) {
      throw new Error("MOCKAPI_ENDPOINT not configured");
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas`, {
      next: { revalidate: 60 }, // ISR: revalidar a cada 60 segundos
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vagas = await response.json();
    return Array.isArray(vagas) ? vagas.filter((v: any) => v.ativa) : [];
  } catch (error) {
    console.error("Erro ao buscar vagas da MockAPI:", error);
    return [];
  }
};

export const getVagaById = async (id: string): Promise<VagaFromMock | null> => {
  try {
    if (!MOCKAPI_ENDPOINT) {
      throw new Error("MOCKAPI_ENDPOINT not configured");
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas/${id}`, {
      next: { revalidate: 60 }, // ISR: revalidar a cada 60 segundos
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }

    const vaga = await response.json();
    return vaga && vaga.ativa ? vaga : null;
  } catch (error) {
    console.error("Erro ao buscar vaga da MockAPI:", error);
    return null;
  }
};

export const addVaga = async (newVaga: VagaFromMock): Promise<void> => {
  try {
    if (!MOCKAPI_ENDPOINT) {
      throw new Error("MOCKAPI_ENDPOINT not configured");
    }

    const response = await fetch(`${MOCKAPI_ENDPOINT}/vagas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVaga),
    });

    if (!response.ok) {
      throw new Error(`MockAPI error: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao adicionar vaga na MockAPI:", error);
    throw error;
  }
};
