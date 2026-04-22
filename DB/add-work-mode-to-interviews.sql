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
