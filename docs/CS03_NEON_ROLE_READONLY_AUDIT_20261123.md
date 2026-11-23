# CS-03 Neon isolated authorization audit — 2026-11-23

**READ-ONLY VERIFICATION — NO-GO.** This document is not approval to deploy or modify database privileges.

## Scope and observation
- Neon organization: `Certification-Study`; project: `certification-study` (Free plan); region: `aws-ap-southeast-1`; PostgreSQL 18.
- Branch: `cs03-auth-isolation-20261117` (`br-snowy-truth-a162pmdt`), **nondefault**, Ready.
- Inspected database: `cs03_auth_sandbox`. Catalog queries only; no credentials read or returned, no data rows fetched, no writes or role/privilege changes.
- Authenticated query used the database owner's role only to inspect **grants and policy metadata**; this is not a successful API-role login test.

## Confirmed
- `cs03_progress_api` exists, can login and connect to `cs03_auth_sandbox`; it is **not** superuser, CREATEROLE, CREATEDB, replication or BYPASSRLS; no direct role memberships observed.
- `public.study_progress` exists, with RLS **enabled and forced**. Single `cs03_verified_owner` policy targets `cs03_progress_api`; SELECT and WITH CHECK limit `user_id` to transaction-local `app.verified_user_id` (fail-closed for unset ID by SQL comparison).
- API role has SELECT/INSERT/UPDATE on `public.study_progress`. It has SELECT-only on `public.study_exam_catalog`; lacks TRUNCATE, REFERENCES and TRIGGER on progress.
- No SELECT/INSERT/UPDATE/DELETE privileges on the inspected `neon_auth` tables, and no USAGE or CREATE on the `neon_auth` schema.
- No CREATE permission on the `public` schema or either examined database.

## Outstanding least-privilege findings (do not silently close)
1. **Excess DELETE grant:** `cs03_progress_api` has DELETE on `public.study_progress`, even though the deployed API design exposes only GET/PUT. A compromised API-role credential could delete records for a `user_id` set within its database session; RLS limits rows but does not remove unnecessary DELETE capability. **Recommendation:** explicitly revoke DELETE on the isolated database/table after reviewing any dependency, then check `has_table_privilege` and runtime behavior. No REVOKE was executed in this audit.
2. **Other database CONNECT:** `cs03_progress_api` can CONNECT to `certification_study` in the same isolated branch. This may be inherited from PostgreSQL's default PUBLIC grants; it does **not** establish cross-branch connectivity or table data access. **Recommendation:** evaluate revoking cross-database CONNECT without affecting other roles or services. Revoke safely only after identifying the grant source and confirming isolation plan. No REVOKE executed.
3. **RLS is not the sole trust boundary:** application code sets `app.verified_user_id` from a verified JWT inside a transaction. The API role may technically set custom PostgreSQL session GUC values itself. Therefore **protect the API-role password, verify JWT signatures and gateway shared secret at the server**, and test that credentials never reach the browser.
4. **Unverified:** real API-role login, permissions under that login and cross-user access denials, physical cross-branch connection separation, remote Worker routing, Cloudflare overflow fail-closed, account-wide usage trends and costs.

## Next action
- Keep CS-03 deploy guard blockers, candidate public routes disabled, and Worker/Neon credentials private.
- Prepare an isolated, reversible least-privilege change proposal for DELETE and other-database CONNECT, with pre/post read-only checks and rollback; obtain explicit approval for any actual Neon privilege edits.
- After approved least-privilege corrections, perform a scoped role-level verification before remote gateway testing.
