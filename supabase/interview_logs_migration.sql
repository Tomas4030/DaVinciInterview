-- supabase/interview_logs_migration.sql
-- Migração para sistema de logs de entrevista

CREATE TABLE IF NOT EXISTS interview_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- "pergunta_enviada", "resposta_recebida", "ia_chamada", "erro", etc
  severity TEXT NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  mensagem TEXT NOT NULL,
  dados_json JSONB DEFAULT '{}'::jsonb,
  duracao_ms INTEGER, -- para operações que levam tempo
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interview_logs_sessao_id 
  ON interview_logs(sessao_id);
CREATE INDEX IF NOT EXISTS idx_interview_logs_tipo 
  ON interview_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_interview_logs_severity 
  ON interview_logs(severity);
CREATE INDEX IF NOT EXISTS idx_interview_logs_timestamp 
  ON interview_logs(timestamp DESC);

-- View para estatísticas de logs por sessão
CREATE OR REPLACE VIEW view_interview_logs_resumo AS
SELECT
  sessao_id,
  COUNT(*) AS total_logs,
  SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) AS errors,
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) AS warnings,
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_errors,
  ROUND(AVG(duracao_ms)::numeric, 0) AS duracao_media_ms,
  SUM(duracao_ms) FILTER (WHERE tipo = 'ia_chamada') AS tempo_total_ia_ms,
  MIN(timestamp) AS primeira_entrada,
  MAX(timestamp) AS ultima_entrada
FROM interview_logs
GROUP BY sessao_id;

-- Tabela de análises (para armazenar resultados de análise)
CREATE TABLE IF NOT EXISTS analises_entrevista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES sessoes_entrevista(id) ON DELETE CASCADE,
  vaga_id TEXT NOT NULL,
  email_candidato TEXT,
  analisis_json JSONB NOT NULL,
  score_geral NUMERIC(4,2),
  recomendacao TEXT CHECK (recomendacao IN ('rejeitar', 'talvez', 'aceitar', 'excelente')),
  criada_em TIMESTAMPTZ DEFAULT NOW(),
  atualizada_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sessao_id)
);

-- Índices para análises
CREATE INDEX IF NOT EXISTS idx_analises_vaga_id 
  ON analises_entrevista(vaga_id);
CREATE INDEX IF NOT EXISTS idx_analises_email 
  ON analises_entrevista(email_candidato);
CREATE INDEX IF NOT EXISTS idx_analises_recomendacao 
  ON analises_entrevista(recomendacao);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp_analises()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizada_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_atualizar_timestamp_analises ON analises_entrevista;
CREATE TRIGGER trigger_atualizar_timestamp_analises
  BEFORE UPDATE ON analises_entrevista
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_analises();

-- Comentários para documentação
COMMENT ON TABLE interview_logs IS 'Logs detalhados de cada entrevista para debug e análise';
COMMENT ON TABLE analises_entrevista IS 'Análises geradas pela IA para cada entrevista';
COMMENT ON COLUMN interview_logs.tipo IS 'Tipo de evento: pergunta_enviada, resposta_recebida, ia_chamada, erro, etc';
COMMENT ON COLUMN interview_logs.severity IS 'Nível de severidade: debug (dev only) | info | warning | error | critical';
COMMENT ON COLUMN interview_logs.dados_json IS 'Dados estruturados específicos do log (varia por tipo)';
