-- Shared multi-certification study progress for DB / PM / SC and future exams.
-- Run ONLY in a separately provisioned, dedicated Neon Free project.
-- The public GitHub Pages app never receives database credentials.
BEGIN;
CREATE TABLE IF NOT EXISTS public.study_exam_catalog (
 exam_code text PRIMARY KEY CHECK (exam_code ~ '^[a-z][a-z0-9_]{1,31}$'),
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
 enabled boolean NOT NULL DEFAULT true
);
INSERT INTO public.study_exam_catalog(exam_code,display_name) VALUES
 ('db','データベーススペシャリスト'),
 ('pm','プロジェクトマネージャ'),
 ('sc','情報処理安全確保支援士')
ON CONFLICT (exam_code) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.study_progress (
 user_id text NOT NULL CHECK (length(user_id) BETWEEN 1 AND 200),
 exam_code text NOT NULL REFERENCES public.study_exam_catalog(exam_code),
 question_id text NOT NULL CHECK (question_id ~ '^20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)$'),
 data jsonb NOT NULL CHECK (jsonb_typeof(data)='object' AND octet_length(data::text)<=16384),
 revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,exam_code,question_id)
);
-- Existing browser keys such as 2025:am2:1 are preserved and assigned exam_code='db'.
-- RLS is defense-in-depth; browser roles never receive table privileges.
REVOKE ALL ON TABLE public.study_progress FROM PUBLIC;
REVOKE ALL ON TABLE public.study_exam_catalog FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  EXECUTE 'REVOKE ALL ON TABLE public.study_progress FROM anon';
  EXECUTE 'REVOKE ALL ON TABLE public.study_exam_catalog FROM anon';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  EXECUTE 'REVOKE ALL ON TABLE public.study_progress FROM authenticated';
  EXECUTE 'REVOKE ALL ON TABLE public.study_exam_catalog FROM authenticated';
 END IF;
END $$;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
-- The Function authenticates the caller and scopes all queries to verified token.sub.
-- Table owner access is used by the Function (owner bypasses RLS); never grant browser SQL access.
COMMIT;
