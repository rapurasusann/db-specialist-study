-- DB Specialist study: run ONLY in the dedicated Neon Free project.
-- Private server API table. The browser has NO SQL/Data API credentials.
BEGIN;
CREATE TABLE IF NOT EXISTS public.db_study_progress (
 user_id text NOT NULL CHECK (length(user_id) BETWEEN 1 AND 200),
 question_id text NOT NULL CHECK (question_id ~ '^20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)$'),
 data jsonb NOT NULL CHECK (jsonb_typeof(data)='object' AND octet_length(data::text)<=16384),
 revision bigint NOT NULL DEFAULT 1 CHECK (revision >= 1),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,question_id)
);
-- Deny public roles completely. Only the server's database owner connects,
-- after verifying Auth JWT. Backend must scope every query to verified sub.
REVOKE ALL ON TABLE public.db_study_progress FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
   EXECUTE 'REVOKE ALL ON TABLE public.db_study_progress FROM anon';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
   EXECUTE 'REVOKE ALL ON TABLE public.db_study_progress FROM authenticated';
 END IF;
END $$;
ALTER TABLE public.db_study_progress ENABLE ROW LEVEL SECURITY;
-- No browser-facing RLS policies. DB owner bypasses RLS; Function verifies JWT
-- and derives user_id from token.sub. Do not set FORCE ROW LEVEL SECURITY.
COMMIT;
