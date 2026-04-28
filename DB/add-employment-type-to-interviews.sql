ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS employment_type
  ENUM('full_time', 'part_time', 'contract', 'internship', 'unspecified')
  NOT NULL
  DEFAULT 'unspecified'
  AFTER work_mode;
