-- =====================================================
-- ALL-IN-ONE SQL (Bootstrap + fases)
-- Projeto: davinci-interviews
--
-- Este ficheiro une os SQLs atuais da pasta DB para executar
-- tudo de uma vez na base de dados.
--
-- Ordem aplicada:
-- 1) schema-mysql.sql
-- 2) phase1-multi-empresa-mysql.sql
-- 3) add-work-mode-to-interviews.sql
-- 4) phase5-interview-verification.sql
-- 5) phase6-ai-comparison-cache.sql
-- =====================================================

-- ========================================
-- [BEGIN] schema-mysql.sql
-- ========================================

-- ========================================
-- SCHEMA MYSQL para MatchWorky-interviews
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
DROP TABLE IF EXISTS vagas;
DROP VIEW IF EXISTS view_interview_logs_resumo;
DROP VIEW IF EXISTS view_sessoes_resumo;
DROP PROCEDURE IF EXISTS cleanup_expired_sessions;

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
-- 1. VAGAS
-- ========================================
CREATE TABLE vagas (
  id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT 'Slug único da vaga',
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  modalidade ENUM('Remoto', 'Híbrido', 'Presencial') NOT NULL DEFAULT 'Remoto',
  duracao_min INT NOT NULL DEFAULT 10,
  perguntas JSON NOT NULL COMMENT 'Array de perguntas [{id, texto, tipo}]',
  ativa BOOLEAN NOT NULL DEFAULT true,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_vagas_ativa (ativa),
  INDEX idx_vagas_modalidade (modalidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2. CANDIDATURA PRINCIPAL
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
-- Seed de exemplo para garantir que a app inicializa sem MockAPI
INSERT INTO vagas (id, titulo, descricao, modalidade, duracao_min, perguntas, ativa)
VALUES
(
  'senior-fullstack-developer',
  'Senior Fullstack Developer',
  'Vaga de referência para entrevistas técnicas.',
  'Remoto',
  30,
  JSON_ARRAY(
    JSON_OBJECT('id', 1, 'texto', 'Fala-nos sobre a tua experiência mais relevante.', 'tipo', 'aberta'),
    JSON_OBJECT('id', 2, 'texto', 'Como desenhaste uma API escalável?', 'tipo', 'aberta')
  ),
  true
)
ON DUPLICATE KEY UPDATE
  titulo = VALUES(titulo),
  descricao = VALUES(descricao),
  modalidade = VALUES(modalidade),
  duracao_min = VALUES(duracao_min),
  perguntas = VALUES(perguntas),
  ativa = VALUES(ativa);

-- ========================================
-- 3. SESSÕES TEMPORÁRIAS (15 min TTL)
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
-- 4. SESSÕES DE ENTREVISTA (Rastreamento)
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
-- 5. RESPOSTAS COM FOLLOW-UPS (V2)
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
-- 6. INTERVIEW LOGS (Auditoria)
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
-- 7. ANÁLISES DE CANDIDATO
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
CREATE PROCEDURE cleanup_expired_sessions()
DELETE FROM candidato_entrevista_sessions
WHERE expires_at <= NOW();

-- View: Resumo de sessões
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
;

-- View: Resumo de logs
CREATE VIEW view_interview_logs_resumo AS
SELECT
  sessao_id,
  COUNT(*) as total_logs,
  SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) as total_errors,
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as total_warnings,
  ROUND(AVG(duracao_ms), 0) as duracao_media_ms
FROM interview_logs
GROUP BY sessao_id
;

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

-- ========================================
-- [END] schema-mysql.sql
-- ========================================


-- ========================================
-- [BEGIN] phase1-multi-empresa-mysql.sql
-- ========================================

-- FASE 1 — Base de Dados Multi-Empresa (MySQL)
-- Projeto atual usa MySQL (ver lib/db.ts), por isso esta migração implementa
-- a fundação multi-empresa no schema MySQL.

START TRANSACTION;

-- =====================================================
-- 1.0) users (base mínima para FKs de ownership/membership)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 1.1) companies
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NULL,
  logo_url TEXT NULL,
  primary_color VARCHAR(16) NULL,

  -- No MySQL atual não existe tabela auth.users local para FK.
  -- Mantemos o campo pronto para migração futura de auth central.
  owner_id CHAR(36) NOT NULL,

  stripe_customer_id VARCHAR(255) NULL,
  subscription_status ENUM('trialing', 'active', 'past_due', 'canceled') NOT NULL DEFAULT 'trialing',
  plan ENUM('basic', 'pro', 'enterprise') NOT NULL DEFAULT 'basic',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_companies_slug (slug),
  UNIQUE KEY uq_companies_stripe_customer_id (stripe_customer_id),
  INDEX idx_companies_owner_id (owner_id),
  INDEX idx_companies_subscription_status (subscription_status),

  CONSTRAINT fk_companies_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 1.2) company_members
-- =====================================================
CREATE TABLE IF NOT EXISTS company_members (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_company_members_company_user (company_id, user_id),
  INDEX idx_company_members_user_id (user_id),
  INDEX idx_company_members_role (role),

  CONSTRAINT fk_company_members_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_company_members_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 1.3) interviews
-- =====================================================
CREATE TABLE IF NOT EXISTS interviews (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,

  -- Mapeamento com o modelo legado baseado em vagas.id (slug)
  legacy_vaga_id VARCHAR(255) NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  work_mode ENUM('remote', 'hybrid', 'onsite', 'unspecified') NOT NULL DEFAULT 'unspecified',
  employment_type ENUM('full_time', 'part_time', 'contract', 'internship', 'unspecified') NOT NULL DEFAULT 'unspecified',
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  questions JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_interviews_legacy_vaga_id (legacy_vaga_id),
  INDEX idx_interviews_company_id (company_id),
  INDEX idx_interviews_status (status),

  CONSTRAINT fk_interviews_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Compatibilidade: marcar vagas legadas com company_id
-- =====================================================
ALTER TABLE vagas
  ADD COLUMN IF NOT EXISTS company_id CHAR(36) NULL;

-- =====================================================
-- 1.4) Adaptar candidato_respostas com company_id/interview_id
-- =====================================================
ALTER TABLE candidato_respostas
  ADD COLUMN IF NOT EXISTS company_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS interview_id CHAR(36) NULL;

-- Empresa legada para backfill seguro
SET @legacy_company_id = '00000000-0000-0000-0000-000000000001';
SET @legacy_owner_id = '00000000-0000-0000-0000-000000000000';

INSERT INTO users (id, email, name)
VALUES (
  @legacy_owner_id,
  'legacy-owner@MatchWorky.local',
  'Legacy Owner'
)
ON DUPLICATE KEY UPDATE
  id = id;

INSERT INTO companies (
  id,
  name,
  slug,
  description,
  owner_id,
  subscription_status,
  plan
)
VALUES (
  @legacy_company_id,
  'Empresa Legada',
  'empresa-legada',
  'Empresa criada automaticamente durante migração para multi-empresa.',
  @legacy_owner_id,
  'trialing',
  'basic'
)
ON DUPLICATE KEY UPDATE
  id = id;

-- Backfill das vagas legadas para uma company
UPDATE vagas
SET company_id = @legacy_company_id
WHERE company_id IS NULL;

-- Criar entrevistas a partir das vagas existentes (1 por vaga)
INSERT INTO interviews (
  id,
  company_id,
  legacy_vaga_id,
  title,
  description,
  work_mode,
  status,
  questions,
  created_at,
  updated_at
)
SELECT
  UUID(),
  COALESCE(v.company_id, @legacy_company_id),
  v.id,
  v.titulo,
  v.descricao,
  CASE
    WHEN LOWER(v.modalidade) = 'remoto' THEN 'remote'
    WHEN LOWER(v.modalidade) IN ('híbrido', 'hibrido') THEN 'hybrid'
    WHEN LOWER(v.modalidade) = 'presencial' THEN 'onsite'
    ELSE 'unspecified'
  END,
  CASE WHEN v.ativa = 1 THEN 'published' ELSE 'archived' END,
  v.perguntas,
  COALESCE(v.criada_em, NOW()),
  COALESCE(v.atualizada_em, NOW())
FROM vagas v
LEFT JOIN interviews i ON i.legacy_vaga_id = v.id
WHERE i.id IS NULL;

-- Backfill candidato_respostas usando mapping legacy vaga -> interview
UPDATE candidato_respostas cr
JOIN interviews i ON i.legacy_vaga_id = cr.vaga_id
SET
  cr.interview_id = i.id,
  cr.company_id = i.company_id
WHERE cr.interview_id IS NULL OR cr.company_id IS NULL;

-- Para candidaturas com vaga_id órfão (sem registo em vagas), criar interview placeholder
INSERT INTO interviews (
  id,
  company_id,
  legacy_vaga_id,
  title,
  description,
  work_mode,
  status,
  questions,
  created_at,
  updated_at
)
SELECT
  UUID(),
  @legacy_company_id,
  cr.vaga_id,
  CONCAT('Entrevista legada: ', cr.vaga_id),
  'Criada automaticamente para preservar dados legados.',
  'unspecified',
  'archived',
  JSON_ARRAY(),
  NOW(),
  NOW()
FROM candidato_respostas cr
LEFT JOIN interviews i ON i.legacy_vaga_id = cr.vaga_id
WHERE i.id IS NULL
GROUP BY cr.vaga_id;

-- Repetir backfill após criação de placeholders
UPDATE candidato_respostas cr
JOIN interviews i ON i.legacy_vaga_id = cr.vaga_id
SET
  cr.interview_id = i.id,
  cr.company_id = i.company_id
WHERE cr.interview_id IS NULL OR cr.company_id IS NULL;

-- Garantias finais
UPDATE candidato_respostas
SET company_id = @legacy_company_id
WHERE company_id IS NULL;

-- Converter para NOT NULL conforme requisito da FASE 1
ALTER TABLE candidato_respostas
  MODIFY company_id CHAR(36) NOT NULL,
  MODIFY interview_id CHAR(36) NOT NULL;

-- Índices de performance
ALTER TABLE candidato_respostas
  ADD INDEX idx_candidato_respostas_company_id (company_id),
  ADD INDEX idx_candidato_respostas_interview_id (interview_id),
  ADD INDEX idx_candidato_respostas_company_interview (company_id, interview_id);

-- FKs para reforçar integridade
ALTER TABLE candidato_respostas
  ADD CONSTRAINT fk_candidato_respostas_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_candidato_respostas_interview
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
    ON DELETE RESTRICT;

COMMIT;

-- ========================================
-- [END] phase1-multi-empresa-mysql.sql
-- ========================================


-- ========================================
-- [BEGIN] add-work-mode-to-interviews.sql
-- ========================================

-- Add dedicated work_mode column to interviews

START TRANSACTION;

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS work_mode ENUM('remote', 'hybrid', 'onsite', 'unspecified')
    NOT NULL DEFAULT 'unspecified'
    AFTER description;

-- Backfill from legacy vagas.modalidade when relation exists
UPDATE interviews i
LEFT JOIN vagas v ON v.id = i.legacy_vaga_id
SET i.work_mode = CASE
  WHEN LOWER(COALESCE(v.modalidade, '')) = 'remoto' THEN 'remote'
  WHEN LOWER(COALESCE(v.modalidade, '')) IN ('híbrido', 'hibrido') THEN 'hybrid'
  WHEN LOWER(COALESCE(v.modalidade, '')) = 'presencial' THEN 'onsite'
  ELSE i.work_mode
END;

-- Backfill from old metadata marker in description (for records created before this migration)
UPDATE interviews
SET work_mode = CASE
  WHEN description LIKE '%[[work_mode:remote]]%' THEN 'remote'
  WHEN description LIKE '%[[work_mode:hybrid]]%' THEN 'hybrid'
  WHEN description LIKE '%[[work_mode:onsite]]%' THEN 'onsite'
  ELSE work_mode
END;

-- Optional cleanup: remove marker text from description after extracting
UPDATE interviews
SET description = TRIM(
  REPLACE(
    REPLACE(
      REPLACE(COALESCE(description, ''), '[[work_mode:remote]]', ''),
      '[[work_mode:hybrid]]', ''
    ),
    '[[work_mode:onsite]]', ''
  )
)
WHERE description LIKE '%[[work_mode:%]]%';

COMMIT;

-- ========================================
-- [END] add-work-mode-to-interviews.sql
-- ========================================


-- ========================================
-- [BEGIN] phase5-interview-verification.sql
-- ========================================

-- FASE 5 — Tokens de verificação por company/interview

CREATE TABLE IF NOT EXISTS interview_verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(32) NOT NULL,
  telefone_pais VARCHAR(8) NOT NULL,
  candidate_name VARCHAR(255) NOT NULL,
  company_id CHAR(36) NOT NULL,
  interview_id CHAR(36) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_interview_verification_expires (expires_at),
  INDEX idx_interview_verification_scope (company_id, interview_id),
  UNIQUE KEY uq_interview_verification_active (email, company_id, interview_id),

  CONSTRAINT fk_interview_verification_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_interview_verification_interview
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- [END] phase5-interview-verification.sql
-- ========================================


-- ========================================
-- [BEGIN] phase6-ai-comparison-cache.sql
-- ========================================

-- Cache de analise IA por empresa/vaga/entrevista

CREATE TABLE IF NOT EXISTS ai_candidate_comparisons (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  vaga_id VARCHAR(255) NOT NULL,
  interview_id CHAR(36) NOT NULL,
  vaga_title VARCHAR(255) NULL,
  interview_title VARCHAR(255) NULL,
  total_candidates INT NOT NULL DEFAULT 0,
  ranking_json JSON NOT NULL,
  direct_comparison_json JSON NOT NULL,
  candidates_snapshot_json JSON NOT NULL,
  source ENUM('ai', 'heuristic') NOT NULL DEFAULT 'heuristic',
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_ai_cmp_scope (company_id, vaga_id, interview_id),
  INDEX idx_ai_cmp_company (company_id),
  INDEX idx_ai_cmp_vaga (company_id, vaga_id),
  INDEX idx_ai_cmp_interview (company_id, interview_id),

  CONSTRAINT fk_ai_cmp_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_cmp_interview
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- [END] phase6-ai-comparison-cache.sql
-- ========================================
