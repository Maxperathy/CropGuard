CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    TEXT NOT NULL,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnoses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_ref           TEXT NOT NULL,
  vision_description  TEXT NOT NULL,
  diagnosis           TEXT NOT NULL,
  confidence          INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  status              TEXT NOT NULL CHECK (status IN ('verified', 'needs_review', 'low_confidence')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('diagnosis_submitted', 'lesson_completed', 'community_activity')),
  points      INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);

