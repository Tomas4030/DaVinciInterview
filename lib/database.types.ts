// lib/database.types.ts
// Tipos gerados manualmente com base no schema.sql
// (para auto-geração: npx supabase gen types typescript --project-id=<id>)

export interface Pergunta {
  id: number;
  texto: string;
  tipo: "aberta" | string;
}

export interface Database {
  public: {
    Tables: {
      vagas: {
        Row: {
          id: string;
          titulo: string;
          descricao: string;
          modalidade: string;
          duracao_min: number;
          perguntas: Pergunta[];
          ativa: boolean;
          criada_em: string;
          atualizada_em: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["vagas"]["Row"],
          "criada_em" | "atualizada_em"
        >;
        Update: Partial<Database["public"]["Tables"]["vagas"]["Insert"]>;
      };
      respostas: {
        Row: {
          id: string;
          sessao_id: string;
          vaga_id: string;
          pergunta_id: number;
          resposta: string;
          criada_em: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["respostas"]["Row"],
          "id" | "criada_em"
        >;
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
