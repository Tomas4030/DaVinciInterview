-- Tabela para rastrear sessões de entrevista com TTL
-- Permite que utilizadores reentrem numa entrevista sem repetir verificação de email dentro de 15 minutos

CREATE TABLE IF NOT EXISTS candidato_entrevista_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_token UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  vaga_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  criada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para queries rápidas
  CONSTRAINT valid_session_token CHECK (session_token IS NOT NULL),
  CONSTRAINT valid_expiry CHECK (expires_at > criada_em)
);

-- Índice para validação rápida de sessão por token
CREATE INDEX idx_candidato_sessions_token ON candidato_entrevista_sessions(session_token);

-- Índice para limpeza de sessões expiradas
CREATE INDEX idx_candidato_sessions_expired ON candidato_entrevista_sessions(expires_at);

-- Índice composto para queries de email + vaga_id
CREATE INDEX idx_candidato_sessions_email_vaga ON candidato_entrevista_sessions(email, vaga_id);

-- Policy RLS: Qualquer um pode ler (validação de sessão)
ALTER TABLE candidato_entrevista_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidato_sessions_public_read" ON candidato_entrevista_sessions
  FOR SELECT
  USING (TRUE);

-- Ativador para limpar sessões expiradas (opcional, mas recomendado)
-- Cria uma função que remove sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM candidato_entrevista_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários de documentação
COMMENT ON TABLE candidato_entrevista_sessions IS 
  'Rastreia sessões temporárias de entrevista. Permite re-entrada sem nova verificação de email dentro do TTL (15 min)';

COMMENT ON COLUMN candidato_entrevista_sessions.session_token IS 
  'UUID único gerado após verificação do email — usado para validar re-entrada';

COMMENT ON COLUMN candidato_entrevista_sessions.expires_at IS 
  'Timestamp de expiração — sessão inválida após este momento';
