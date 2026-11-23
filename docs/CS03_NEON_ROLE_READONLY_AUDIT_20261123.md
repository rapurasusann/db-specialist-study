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

## Grant provenance confirmation (same isolated branch/database; read-only)

Inspection of `pg_database.datacl`, `pg_class.relacl` and `aclexplode` established:

- **DELETE on `cs03_auth_sandbox.public.study_progress`:** explicit table grant to `cs03_progress_api`, granted by `certification_study_owner`. It is independently removable without revoking SELECT/INSERT/UPDATE.
- **CONNECT on `certification_study`:** granted to PostgreSQL **PUBLIC** (`=Tc/certification_study_owner`). The API role gets this permission *through PUBLIC*, and has **no explicit CONNECT grant on that database**. `REVOKE CONNECT ON DATABASE certification_study FROM cs03_progress_api` alone will **not** remove access granted through PUBLIC.
- **CONNECT on `cs03_auth_sandbox`:** both PUBLIC and an explicit API-role CONNECT grant exist. The latter is expected and must remain.
- PostgreSQL does not provide a per-role `DENY` that overrides privileges granted through PUBLIC. **Do not execute `REVOKE CONNECT ... FROM PUBLIC` without a separate, wider impact analysis of all roles/services**, because it changes permissions for every role that currently depends on PUBLIC.
- No SQL modifications were performed. Role-level runtime tests, grant changes, the route fail-closed setting and cost acceptance remain open.

### Safe change proposal — requires separate authorization before execution

**Scope:** only the existing `cs03_auth_sandbox.public.study_progress` table on isolated branch `br-snowy-truth-a162pmdt`. Never run against main/default branch.

Preconditions: record actual `current_database()`, `current_user`, branch ID from the Neon console, and current ACL; confirm app has no DELETE API endpoint or migration requiring this privilege. Verify the role has SELECT, INSERT and UPDATE before proceeding.

Proposed **single scoped change** (not executed):
```sql
REVOKE DELETE ON TABLE public.study_progress FROM cs03_progress_api;
```

Postconditions (read-only): `has_table_privilege('cs03_progress_api','public.study_progress','DELETE') = false`; SELECT/INSERT/UPDATE remain true; forced RLS policy unchanged. Repeat only the relevant account read/write/row-isolation tests. If app functionality unexpectedly fails, stop and inspect dependencies; an explicitly approved rollback would be:
```sql
GRANT DELETE ON TABLE public.study_progress TO cs03_progress_api;
```

**Do not change CONNECT on `certification_study` in this step**. Instead, keep cross-database CONNECT as an explicit residual privilege and review whether all current users and services can tolerate revoking PUBLIC CONNECT in a separate change window. In the meantime confirm the API role has no USAGE on sensitive schemas or table privileges in that database; merely testing CONNECT is insufficient.

**Status:** written proposal only. No privilege changes, secret access, new resources or deployment.

### Additional read-only cross-database catalog check
In the **same isolated branch** `certification_study` database (connected as catalog-inspection owner, not the API role): `has_database_privilege(...,'CONNECT')` was true for `cs03_progress_api`; one non-system schema was USAGE-accessible; **zero non-system tables/views/materialized views/sequences** had SELECT, INSERT, UPDATE or DELETE via `has_table_privilege` at inspection time. This reduces direct table-data exposure but does not demonstrate that the API role cannot connect, nor audit every executable function or future grant. No data rows were read or changed.

## Approved privilege correction — executed 2026-11-23

The operator explicitly approved revoking **only** DELETE on isolated branch `br-snowy-truth-a162pmdt`, database `cs03_auth_sandbox`, table `public.study_progress`, role `cs03_progress_api`.

Executed exactly:
```sql
REVOKE DELETE ON TABLE public.study_progress FROM cs03_progress_api;
```

Neon returned success (no result rows). Immediate **read-only** postcheck in the same isolated database, using catalog-inspection owner `certification_study_owner`:

| Check | Result |
|---|---|
| API-role DELETE on `public.study_progress` | **false** |
| API-role SELECT | **true** |
| API-role INSERT | **true** |
| API-role UPDATE | **true** |
| `relrowsecurity` enabled | **true** |
| `relforcerowsecurity` forced | **true** |
| `cs03_verified_owner` policy present | **1** |

No table data was read or deleted, no other table privileges were edited, and main/default branch was untouched. Earlier sections document **pre-change observations and proposal**; this section records the executed correction and supersedes the earlier "not executed" status for the DELETE grant.

**Still open:** role-authenticated functional GET/PUT and cross-user denial tests against the isolated database, other-database PUBLIC CONNECT scope, Cloudflare fail-closed real route verification, and production deployment approval. Maintain NO-GO.

## API-role live read-only verification — 2026-11-23

After the operator-approved DELETE revocation, Neon SQL was executed using **`role_name=cs03_progress_api`** in the exact non-default branch `br-snowy-truth-a162pmdt`.

- On `cs03_auth_sandbox`: `current_user` and `session_user` both confirmed `cs03_progress_api`; `app.verified_user_id` was NULL.
- Role-level privileges: SELECT=true, INSERT=true, UPDATE=true, **DELETE=false** on `public.study_progress`.
- `SELECT count(*) FROM public.study_progress` returned **0 visible rows** without verified user GUC. Only a count was requested; no study records were returned or modified.
- On the separate `certification_study` database **within the same isolated branch**, connecting **as `cs03_progress_api` succeeded**, confirming residual PUBLIC CONNECT. The role can USAGE the `public` schema, **cannot USAGE `neon_auth`**, and `information_schema.tables` exposed **0 tables** for `public` or `neon_auth` to this role.
- A direct `has_table_privilege(...,'neon_auth.user','SELECT')` name-lookup attempt failed with SQLSTATE **42501 permission denied for schema neon_auth**, corroborating the schema boundary; a follow-up query avoided that name resolution and completed.

**Limits of evidence:** zero visible rows with no user context does not test cross-user denial with two real identities or successful INSERT/UPDATE. No JWT was minted, no user data was written or read, and no privilege was changed during these checks. Retain NO-GO pending scoped write/read acceptance, real edge configuration, and cost guard verification.
