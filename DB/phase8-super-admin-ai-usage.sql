CREATE TABLE IF NOT EXISTS super_admins (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_super_admin_id CHAR(36) NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_super_admins_email (email),
  INDEX idx_super_admins_active (is_active),
  CONSTRAINT fk_super_admins_created_by
    FOREIGN KEY (created_by_super_admin_id) REFERENCES super_admins(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_model_pricing (
  model VARCHAR(120) NOT NULL,
  input_usd_per_1m_tokens DECIMAL(12, 6) NOT NULL,
  output_usd_per_1m_tokens DECIMAL(12, 6) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ai_model_pricing (model, input_usd_per_1m_tokens, output_usd_per_1m_tokens, is_active)
VALUES ('gpt-4o-mini', 0.150000, 0.600000, 1)
ON DUPLICATE KEY UPDATE
  input_usd_per_1m_tokens = VALUES(input_usd_per_1m_tokens),
  output_usd_per_1m_tokens = VALUES(output_usd_per_1m_tokens),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id CHAR(36) NOT NULL,
  company_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  interview_id CHAR(36) NULL,
  session_id CHAR(36) NULL,
  feature VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(12, 8) NOT NULL DEFAULT 0,
  latency_ms INT NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ai_usage_logs_created (created_at),
  INDEX idx_ai_usage_logs_company_created (company_id, created_at),
  INDEX idx_ai_usage_logs_feature_created (feature, created_at),
  INDEX idx_ai_usage_logs_model_created (model, created_at),
  CONSTRAINT fk_ai_usage_logs_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_logs_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
