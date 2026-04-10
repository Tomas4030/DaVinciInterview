// lib/database.types.ts
// Tipos gerados manualmente com base no schema.sql
// (para auto-geração: npx supabase gen types typescript --project-id=<id>)

export interface FollowUpRecord {
  id: string;
  tipo: "usuario_resposta" | "ia_follow_up";
  conteudo: string;
  timestamp: string;
}

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
        Insert: {
          id: string;
          titulo: string;
          descricao?: string;
          modalidade?: string;
          duracao_min?: number;
          perguntas?: Pergunta[];
          ativa?: boolean;
        };
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
        Insert: {
          sessao_id: string;
          vaga_id: string;
          pergunta_id: number;
          resposta: string;
        };
        Update: {
          sessao_id?: string;
          vaga_id?: string;
          pergunta_id?: number;
          resposta?: string;
        };
      };
      candidato_respostas_v2: {
        Row: {
          id: string;
          sessao_id: string;
          vaga_id: string;
          pergunta_id: number;
          resposta_final: string;
          iteration_count: number;
          follow_ups: FollowUpRecord[];
          estado: "in_progress" | "completed" | "saved";
          criada_em: string;
          atualizada_em: string;
          guardada_em?: string;
        };
        Insert: {
          sessao_id: string;
          vaga_id: string;
          pergunta_id: number;
          resposta_final: string;
          iteration_count?: number;
          follow_ups?: FollowUpRecord[];
          estado?: "in_progress" | "completed" | "saved";
        };
        Update: {
          resposta_final?: string;
          iteration_count?: number;
          follow_ups?: FollowUpRecord[];
          estado?: "in_progress" | "completed" | "saved";
          atualizada_em?: string;
          guardada_em?: string;
        };
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
