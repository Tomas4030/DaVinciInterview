ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS experience_level
  ENUM('desired', 'not_required')
  NOT NULL
  DEFAULT 'not_required'
  AFTER employment_type,
  ADD COLUMN IF NOT EXISTS card_emoji
  VARCHAR(32)
  NULL
  AFTER experience_level,
  ADD COLUMN IF NOT EXISTS card_theme
  ENUM('sky', 'mint', 'violet', 'amber', 'slate')
  NOT NULL
  DEFAULT 'slate'
  AFTER card_emoji;
