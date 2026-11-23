-- CS-03 verified-owner RLS — ISOLATED SANDBOX ONLY
-- Organization: Certification-Study; Neon branch: cs03-auth-isolation-20261117
-- Database: cs03_auth_sandbox. Never apply to production without review.
-- Prerequisites: public.study_progress has FORCE ROW LEVEL SECURITY;
-- a non-BYPASSRLS, server-only cs03_progress_api role exists.
-- CRITICAL: The trusted identity GUC is NOT an auth mechanism.
-- Any SQL client with this DB role can run set_config and impersonate users.
-- NEVER expose its DB credentials/SQL endpoint to browsers or untrusted actors.
-- An application server MUST verify signature, exp, iss, aud of JWT before
-- setting app.verified_user_id with SET LOCAL inside the same DB transaction.

BEGIN;
REVOKE ALL PRIVILEGES ON public.study_exam_catalog FROM cs03_progress_api;
GRANT SELECT ON public.study_exam_catalog TO cs03_progress_api;
ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_progress FORCE ROW LEVEL SECURITY;
CREATE POLICY cs03_verified_owner ON public.study_progress
  FOR ALL TO cs03_progress_api
  USING (user_id = NULLIF(current_setting('app.verified_user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('app.verified_user_id', true), ''));
COMMIT;

-- Representative server-only transaction (not directly accessible to a client):
-- BEGIN;
-- SELECT set_config('app.verified_user_id', :jwt_verified_subject, true);
-- SELECT ... FROM public.study_progress WHERE user_id = :jwt_verified_subject;
-- COMMIT;
-- The bound subject MUST come only from strict JWT validation, never a request field.

-- Verified 2026-11-17, real Neon isolated DB (simulated identity binding):
-- A own insert/read PASS, B own insert PASS;
-- B read A => 0, update/delete A => 0, forged insert A => RLS 42501;
-- missing identity read => 0, insert => RLS 42501;
-- A row remains unchanged after B's attempts.
-- NOT YET TESTED: end-to-end JWT -> API -> DB, direct API access, token expiry
-- and forgery at API boundary, authenticated cross-device sync.
