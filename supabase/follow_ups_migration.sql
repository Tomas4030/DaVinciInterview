-- supabase/follow_ups_migration.sql
-- Migração para suportar persistência de follow-ups e histórico detalhado de entrevistas

-- Tabela de sessões de entrevista (nova)
CREATE TABLE IF NOT EXISTS sessoes_entrevista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id TEXT NOT NULL,
  email_candidato TEXT,
  telefone_candidato TEXT,
  estado TEXT DEFAULT 'em_progresso' CHECK (estado IN ('em_progresso', 'concluida', 'cancelada')),
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  concluida_em TIMESTAMPTZ,
  duracao_minutos INTEGER
);

-- Tabela expandida de respostas com follow-ups (novo schema v2)
CREATE TABLE IF NOT EXISTS candidato_respostas_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES sessoes_entrevista(id) ON DELETE CASCADE,
  vaga_id TEXT NOT NULL,
  pergunta_id INTEGER NOT NULL,
  resposta_final TEXT NOT NULL,
  iteration_count INTEGER DEFAULT 1,
  
  -- Follow-ups: array de objetos {id, tipo, conteudo, timestamp}
  follow_ups JSONB DEFAULT '[]'::jsonb,
  
  -- Estado da resposta
  estado TEXT DEFAULT 'in_progress' CHECK (estado IN ('in_progress', 'completed', 'saved')),
  
  -- Métricas para análise
  tamanho_resposta INTEGER, -- número de palavras
  tempo_resposta_segundos INTEGER,
  qualidade_estimada TEXT CHECK (qualidade_estimada IN ('rejeitar', 'minima', 'aceitavel', 'boa', 'excelente')),
  
  -- Detecção de características
  tem_exemplos BOOLEAN DEFAULT FALSE,
  tem_justificacao BOOLEAN DEFAULT FALSE,
  tem_detalhes BOOLEAN DEFAULT FALSE,
  tem_conhecimento_tecnico BOOLEAN DEFAULT FALSE,
  
  -- Rastreamento de tempo
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ DEFAULT NOW(),
  guardada_em TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(sessao_id, pergunta_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_candidato_respostas_v2_sessao_id 
  ON candidato_respostas_v2(sessao_id);
CREATE INDEX IF NOT EXISTS idx_candidato_respostas_v2_vaga_id 
  ON candidato_respostas_v2(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidato_respostas_v2_estado 
  ON candidato_respostas_v2(estado);
CREATE INDEX IF NOT EXISTS idx_sessoes_entrevista_vaga_id 
  ON sessoes_entrevista(vaga_id);

-- Função para atualizar timestamp automático
CREATE OR REPLACE FUNCTION atualizar_timestamp_candidato_respostas_v2()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizada_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_atualizar_timestamp_candidato_respostas_v2 ON candidato_respostas_v2;
CREATE TRIGGER trigger_atualizar_timestamp_candidato_respostas_v2
  BEFORE UPDATE ON candidato_respostas_v2
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_candidato_respostas_v2();

-- View para estatísticas por sessão
CREATE OR REPLACE VIEW view_sessoes_resumo AS
SELECT 
  s.id,
  s.vaga_id,
  s.email_candidato,
  s.estado,
  s.criada_em,
  COUNT(cr.id) AS total_respostas,
  SUM(CASE WHEN cr.estado = 'saved' THEN 1 ELSE 0 END) AS respostas_guardadas,
  ROUND(AVG(cr.tamanho_resposta)::numeric, 0) AS tamanho_medio_resposta,
  ROUND(AVG(cr.tempo_resposta_segundos)::numeric, 0) AS tempo_medio_segundos,
  SUM(CASE WHEN cr.tem_exemplos THEN 1 ELSE 0 END) AS respostas_com_exemplos
FROM sessoes_entrevista s
LEFT JOIN candidato_respostas_v2 cr ON s.id = cr.sessao_id
GROUP BY s.id, s.vaga_id, s.email_candidato, s.estado, s.criada_em;

-- Comentários para documentação
COMMENT ON TABLE sessoes_entrevista IS 'Sessão de entrevista de um candidato para uma vaga específica';
COMMENT ON TABLE candidato_respostas_v2 IS 'Respostas com histórico completo de follow-ups e iterações';
COMMENT ON COLUMN candidato_respostas_v2.follow_ups IS 'Array JSONB com histórico de interações: [{id, tipo (usuario_resposta|ia_follow_up), conteudo, timestamp}]';
COMMENT ON COLUMN candidato_respostas_v2.qualidade_estimada IS 'Qualidade da resposta: rejeitar | minima | aceitavel | boa | excelente';
