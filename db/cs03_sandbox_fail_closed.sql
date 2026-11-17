-- CS-03 isolated test database only: cs03_auth_sandbox
-- Database: Certification-Study / certification-study / cs03-auth-isolation-20261117
-- Do not run on production or the original certification_study database.
-- This is a fail-closed baseline, not a complete auth/RLS implementation.
BEGIN;
CREATE TABLE IF NOT EXISTS public.study_exam_catalog (
  exam_code text PRIMARY KEY CHECK (exam_code ~ '^[a-z][a-z0-9_]{1,31}$'),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.study_progress (
  user_id text NOT NULL CHECK (length(user_id) BETWEEN 1 AND 200),
  exam_code text NOT NULL REFERENCES public.study_exam_catalog(exam_code),
  question_id text NOT NULL CHECK (question_id ~ '^20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)$'),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND octet_length(data::text) <= 16384),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exam_code, question_id)
);
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress FORCE ROW LEVEL SECURITY;
COMMIT;
-- No GRANT, no ALLOW policies, no users or study data inserted.
-- Verify via a non-owner/non-BYPASSRLS role. Only after trusted identity
-- context is designed should the application receive scoped permissions.
