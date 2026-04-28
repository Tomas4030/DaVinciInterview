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
  experience_level ENUM('desired', 'not_required') NOT NULL DEFAULT 'not_required',
  card_emoji VARCHAR(32) NULL,
  card_theme ENUM('sky', 'mint', 'violet', 'amber', 'slate') NOT NULL DEFAULT 'slate',
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
