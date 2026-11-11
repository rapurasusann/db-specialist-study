-- DB Specialist study: dedicated Neon project ONLY.
-- Prerequisites: enable Neon Auth and Data API and confirm auth.user_id().
-- Never execute against Wordbook or ParkWait databases.
BEGIN;
CREATE TABLE IF NOT EXISTS public.db_study_progress (
  user_id text NOT NULL,
  question_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id),
  CONSTRAINT db_study_question_id_valid CHECK (question_id ~ '^20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)$'),
  CONSTRAINT db_study_data_object CHECK (jsonb_typeof(data) = 'object'),
  CONSTRAINT db_study_data_size CHECK (octet_length(data::text) <= 16384)
);
ALTER TABLE public.db_study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_study_progress FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.db_study_progress FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.db_study_progress TO authenticated;
DROP POLICY IF EXISTS db_study_select_own ON public.db_study_progress;
CREATE POLICY db_study_select_own ON public.db_study_progress FOR SELECT TO authenticated
USING (user_id = (select auth.user_id()));
DROP POLICY IF EXISTS db_study_insert_own ON public.db_study_progress;
CREATE POLICY db_study_insert_own ON public.db_study_progress FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.user_id()));
DROP POLICY IF EXISTS db_study_update_own ON public.db_study_progress;
CREATE POLICY db_study_update_own ON public.db_study_progress FOR UPDATE TO authenticated
USING (user_id = (select auth.user_id()))
WITH CHECK (user_id = (select auth.user_id()));
DROP POLICY IF EXISTS db_study_delete_own ON public.db_study_progress;
CREATE POLICY db_study_delete_own ON public.db_study_progress FOR DELETE TO authenticated
USING (user_id = (select auth.user_id()));
COMMIT;
