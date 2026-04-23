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
