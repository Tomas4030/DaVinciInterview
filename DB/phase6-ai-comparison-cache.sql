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
