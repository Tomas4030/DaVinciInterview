-- ========================================
-- SCHEMA MYSQL para davinci-interviews
-- Substituir: PostgreSQL → MySQL
-- ========================================

-- Drop tables (se existirem) para recriação limpa
DROP TABLE IF EXISTS analises_entrevista;
DROP TABLE IF EXISTS candidato_respostas_v2;
DROP TABLE IF EXISTS interview_logs;
DROP TABLE IF EXISTS sessoes_entrevista;
DROP TABLE IF EXISTS candidato_entrevista_sessions;
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS candidato_respostas;

-- ========================================
-- 0. CÓDIGOS DE VERIFICAÇÃO
-- ========================================
CREATE TABLE verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL COMMENT 'TTL: 15 minutos',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_expires (expires_at),
  UNIQUE KEY unique_email_code (email, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 1. CANDIDATURA PRINCIPAL
-- ========================================
CREATE TABLE candidato_respostas (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  vaga_id VARCHAR(255) NOT NULL,
  sessao_id CHAR(36) NOT NULL UNIQUE COMMENT 'Ligação a sessão',
  respostas JSON COMMENT 'Array de respostas em JSON',
  status ENUM('em_progresso', 'concluida', 'rejeitada', 'em_analise') DEFAULT 'em_progresso',
  email_verificado BOOLEAN DEFAULT false,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_vaga_id (vaga_id),
  INDEX idx_sessao_id (sessao_id),
  INDEX idx_status (status),
  INDEX idx_lookup (email, telefone, vaga_id, criada_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2. SESSÕES TEMPORÁRIAS (15 min TTL)
-- ========================================
CREATE TABLE candidato_entrevista_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_token CHAR(36) NOT NULL UNIQUE COMMENT 'UUID v4',
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  vaga_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL COMMENT 'TTL: 15 minutos',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_token (session_token),
  INDEX idx_expires (expires_at),
  INDEX idx_email_vaga (email, vaga_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 3. SESSÕES DE ENTREVISTA (Rastreamento)
-- ========================================
CREATE TABLE sessoes_entrevista (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  vaga_id VARCHAR(255) NOT NULL,
  email_candidato VARCHAR(255),
  telefone_candidato VARCHAR(20),
  estado ENUM('em_progresso', 'concluida', 'cancelada') DEFAULT 'em_progresso',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  concluida_em TIMESTAMP NULL,
  duracao_minutos INT COMMENT 'Duração total em minutos',
  
  INDEX idx_vaga_id (vaga_id),
  INDEX idx_email_candidato (email_candidato),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 4. RESPOSTAS COM FOLLOW-UPS (V2)
-- ========================================
CREATE TABLE candidato_respostas_v2 (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  sessao_id CHAR(36) NOT NULL,
  vaga_id VARCHAR(255) NOT NULL,
  pergunta_id INT NOT NULL,
  resposta_final TEXT NOT NULL,
  iteration_count INT DEFAULT 1 COMMENT 'Número de revisões',
  follow_ups JSON COMMENT 'Array de follow-ups: {"id", "tipo", "conteudo", "timestamp"}',
  estado ENUM('in_progress', 'completed', 'saved') DEFAULT 'in_progress',
  tamanho_resposta INT DEFAULT 0 COMMENT 'Word count',
  tempo_resposta_segundos INT DEFAULT 0,
  qualidade_estimada ENUM('rejeitar', 'minima', 'aceitavel', 'boa', 'excelente') DEFAULT 'minima',
  tem_exemplos BOOLEAN DEFAULT false,
  tem_justificacao BOOLEAN DEFAULT false,
  tem_detalhes BOOLEAN DEFAULT false,
  tem_conhecimento_tecnico BOOLEAN DEFAULT false,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_sessao_pergunta (sessao_id, pergunta_id),
  INDEX idx_sessao_id (sessao_id),
  INDEX idx_vaga_id (vaga_id),
  INDEX idx_estado (estado),
  INDEX idx_qualidade (qualidade_estimada),
  FOREIGN KEY (sessao_id) REFERENCES sessoes_entrevista(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 5. INTERVIEW LOGS (Auditoria)
-- ========================================
CREATE TABLE interview_logs (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  sessao_id CHAR(36) COMMENT 'Ligação a sessão',
  tipo VARCHAR(100) NOT NULL COMMENT 'pergunta_enviada, resposta_recebida, ia_chamada, erro, etc',
  severity ENUM('debug', 'info', 'warning', 'error', 'critical') DEFAULT 'info',
  mensagem TEXT NOT NULL,
  dados_json JSON COMMENT 'Structured event data',
  duracao_ms INT COMMENT 'Tempo de execução em ms',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sessao_id (sessao_id),
  INDEX idx_tipo (tipo),
  INDEX idx_severity (severity),
  INDEX idx_timestamp (timestamp DESC),
  FOREIGN KEY (sessao_id) REFERENCES sessoes_entrevista(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 6. ANÁLISES DE CANDIDATO
-- ========================================
CREATE TABLE analises_entrevista (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  sessao_id CHAR(36) NOT NULL UNIQUE,
  vaga_id VARCHAR(255) NOT NULL,
  email_candidato VARCHAR(255),
  analisis_json JSON NOT NULL COMMENT 'Análise completa',
  score_geral DECIMAL(4, 2) COMMENT 'Score 0.00 a 100.00',
  recomendacao ENUM('rejeitar', 'talvez', 'aceitar', 'excelente') DEFAULT 'talvez',
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_vaga_id (vaga_id),
  INDEX idx_email_candidato (email_candidato),
  INDEX idx_recomendacao (recomendacao),
  INDEX idx_score (score_geral DESC),
  FOREIGN KEY (sessao_id) REFERENCES sessoes_entrevista(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- STORED PROCEDURES / HELPERS
-- ========================================

-- Procedure: Limpar sessões expiradas (executar periodicamente)
DELIMITER $$
CREATE PROCEDURE cleanup_expired_sessions()
BEGIN
  DELETE FROM candidato_entrevista_sessions 
  WHERE expires_at <= NOW();
END$$
DELIMITER ;

-- View: Resumo de sessões
DELIMITER $$
CREATE VIEW view_sessoes_resumo AS
SELECT
  s.id,
  s.vaga_id,
  s.email_candidato,
  s.estado,
  s.criada_em,
  COUNT(rv2.id) as total_respostas,
  SUM(CASE WHEN rv2.estado = 'completed' THEN 1 ELSE 0 END) as respostas_completadas,
  ROUND(AVG(rv2.tamanho_resposta), 0) as tamanho_medio_resposta,
  ROUND(AVG(rv2.tempo_resposta_segundos), 0) as tempo_medio_segundos
FROM sessoes_entrevista s
LEFT JOIN candidato_respostas_v2 rv2 ON s.id = rv2.sessao_id
GROUP BY s.id
$$
DELIMITER ;

-- View: Resumo de logs
DELIMITER $$
CREATE VIEW view_interview_logs_resumo AS
SELECT
  sessao_id,
  COUNT(*) as total_logs,
  SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) as total_errors,
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as total_warnings,
  ROUND(AVG(duracao_ms), 0) as duracao_media_ms
FROM interview_logs
GROUP BY sessao_id
$$
DELIMITER ;

-- ========================================
-- INDICES FULL-TEXT (Análises)
-- ========================================
ALTER TABLE analises_entrevista ADD FULLTEXT INDEX ft_analisis (analisis_json);

-- ========================================
-- INSERTs de TESTE (Opcional)
-- ========================================

-- Nota: Em produção, estes INSERTs serão removidos

INSERT INTO sessoes_entrevista (id, vaga_id, email_candidato, estado)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'vaga-001', 'teste@example.com', 'em_progresso');

INSERT INTO candidato_respostas (id, email, telefone, vaga_id, sessao_id, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'teste@example.com',
  '+351912345678',
  'vaga-001',
  '550e8400-e29b-41d4-a716-446655440000',
  'em_progresso'
);

-- ========================================
-- COMMIT
-- ========================================
-- Schema criado com sucesso!
