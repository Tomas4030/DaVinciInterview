export type ResponseRow = {
  id: string;
  sessao_id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  interview_id: string;
  interview_title: string | null;
};

export type SessionRow = {
  id: string;
  sessao_id: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  respostas: string | null;
  interview_title: string | null;
};

export type ResponseAnswerItem = {
  texto_pergunta?: string;
  question?: string;
  pergunta?: string;
  resposta_texto?: string;
  resposta?: string;
  answer?: string;
};
