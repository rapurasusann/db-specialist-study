# CS-03 Cloudflare Free-tier and isolated release readiness — 2026-11-23

**STATUS: REVIEW ONLY — NO-GO.** This document is not a deployment approval or the mandatory `CS03_GATEWAY_RATE_LIMIT_ACCEPTANCE.md` acceptance artifact.

## Verified locally
- 154/154 CS-03 Node regression tests PASS (user-supplied log, commit `ba3f37c`).
- Wrangler 4.166.0 (workerd-local) GET/PUT fake progress + EdDSA JWT verification + SQLite Durable Object quota, rejects invalid JWT (401), origin (403), quota excess (429).
- The real Neon production datastore, actual Cloudflare account, actual public Worker deployment and any multi-instance cloud behavior have NOT been tested.

## Current published provider limits (read-only, NOT account entitlements)
- Workers Free: 100,000 requests/day **per account**, reset at 00:00 UTC, 10 ms CPU/request; shared across other applicable Workers usage.
- Workers Free route exhaustion: **fail open bypasses security processing**, **fail closed returns Error 1027**. Security route MUST be fail closed.
- SQLite-backed Durable Objects on Workers Free: 100,000 requests/day, 13,000 GB-s/day; if free limits are exhausted, further operations fail rather than silently charging. This means availability can degrade and must not be confused with application success.
- Free Durable Objects storage: **1 GB maximum per individual SQLite Object and 5 GB total per account**. Earlier provider evaluation stated only 5 GB total; that was incomplete.
- SQLite row-read/write and duration allowances are separately metered. Verify current figures and actual dashboard usage before proposing any deployment. A request to the gateway plus a call to Durable Objects consumes more than one resource category.
Sources:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/durable-objects/platform/pricing/
https://developers.cloudflare.com/durable-objects/platform/limits/

## Explicit items that must be verified before a remotely isolated test
1. Cloudflare account plan, Workers Free tier, Durable Objects Free tier, and existing usage across **all projects**, including ParkWait, from the account dashboard. **NOT VERIFIED**.
2. No billing upgrade, pay-as-you-go, paid Worker or paid Durable Object enabled. Obtain proof of no additional charges and a safe rollback path. **NOT VERIFIED**.
3. Fail-closed Free request exhaustion for the actual Worker route: no bypass to an unprotected Neon API. **NOT VERIFIED**.
4. Dedicated isolated Worker route, Durable Object namespace, and secrets; must not expose `local/` test-only keys, source or diagnostic handlers. **NOT IMPLEMENTED**.
5. Deployable Worker entrypoint with trusted IP verification, JWT issuer/audience/JWKS and secret management; confirm Cloudflare CPU 10 ms Free limit in runtime. **NOT IMPLEMENTED / VERIFIED**.
6. Atomic quota decision under remote concurrency/restart, separate global/per-IP/per-user thresholds, failure behavior and storage consumption. Local tests pass, **remote tests not run**.
7. Dedicated Neon isolated database/role/credentials and guaranteed absence of access to production data. **NOT VERIFIED**.
8. Explicit isolated-deployment approval before any remote operations. **NOT GRANTED**.

## Hard safety gates
- Keep `TRUSTED_GATEWAY_NOT_IMPLEMENTED`, `GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING`, `ISOLATED_DEPLOYMENT_APPROVAL_MISSING` active until verifiable independent criteria are met.
- Do not deploy the local test harness or any test signing key.
- Do not rename this document to a signed-off acceptance or approval file.
- Never deploy or purchase services automatically. The next action is a **read-only account-plan / consumption audit** followed by completing an isolated production adapter.
