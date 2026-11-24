# CS-03 trusted gateway — rate-limit design draft (2026-11-23)

Status: **DRAFT / NOT DEPLOYABLE / NO LIVE ENVIRONMENT CHANGES**.

## Current state

- `server/cs03-trusted-edge-gateway.mjs` uses in-process Map counters and an in-process inflight counter.
- These controls do not share state across instances or survive restarts; they cannot guarantee global limits or billing protection.
- `scripts/cs03-predeploy-guard.mjs` intentionally blocks deployment. Do not relax it based on this design note.
- Client `Origin` checks are browser/CORS protections, **not** an authentication mechanism. Require independently verified bearer tokens and a gateway-to-function secret.
- Existing tests use isolated memory stores; they do not prove Neon or browser network behavior.

## Acceptance criteria before any isolated deployment

1. **Atomic shared quotas:** Every gateway instance uses the same trusted, durable or externally coordinated store, with atomic check-and-increment for a sliding or fixed time window. Define and verify exact global, per-user and per-trusted-IP limits, window boundaries, and TTL; reject over-limit requests before calling Neon Functions.
2. **Cross-instance behavior:** With 2+ independently created gateway instances sharing a test store, concurrent requests cannot exceed each configured quota. Restart of one instance must not reset consumed shared quota. Directly supplied `X-Forwarded-For` must never choose the quota key.
3. **Fail closed:** If quota storage is unavailable, inconsistent, times out, or has unknown state, reject with a sanitized 503. Do not fall back to local-only counters or call the downstream Function/DB. Add negative tests for each failure.
4. **Concurrency/budget controls:** Per-instance `maxInflight` alone is insufficient. Define shared concurrency or request budget protection, hard ceiling, alert/disable path, and verified provider free-tier quotas; never assume a service remains free after resource exhaustion.
5. **Authentication and secrets:** Validate signed JWT at the trusted edge; independently bind database authorization to verified subject. Gateway secret is configured only in trusted runtimes, never browser bundle, static files, error messages or logs. Rotate it through a documented process.
6. **Upstream safety:** Restrict HTTPS destination to the configured Function endpoint; disallow redirects, bound request/response sizes and timeouts, sanitize upstream errors. Network failures do not modify local learning progress or automatically overwrite remote records.
7. **Privacy/observability:** Do not log JWTs, passwords, raw learning records, IPs unnecessarily or secrets. Test abuse, data isolation, failure scenarios, and log redaction.
8. **Proof before launch:** Execute automated unit tests, isolated end-to-end tests against separately provisioned **test-only** DB/role with verified TLS, and actual browser sign-in/sync tests; record evidence and explicit deployment approval.

## Required tests

- T01 concurrent same-user burst through 2 gateways -> at most N accepted across both.
- T02 combined users over global limit -> 429 and no Function calls past N.
- T03 trusted-IP quota with spoofed `X-Forwarded-For` -> spoofing cannot evade limit.
- T04 gateway instance reset -> shared quotas remain active.
- T05 atomic store unavailable, timeout, malformed response -> 503; Function calls remain zero.
- T06 untrusted origin, invalid/expired JWT, missing/invalid gateway secret -> reject before database access.
- T07 large PUT, unsupported media type/method, redirect and upstream timeout -> bounded, sanitized failure.
- T08 server-side secret never appears in client bundle or logs.
- T09 account A cannot access B and stale revision never silently overwrites newer data.
- T10 cost and quota thresholds demonstrated on the chosen provider; approved stop/rollback plan.

## Deployment gates

- Keep `TRUSTED_GATEWAY_NOT_IMPLEMENTED`, `GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING`, and `ISOLATED_DEPLOYMENT_APPROVAL_MISSING` blocked until implementation, evidence, acceptance sign-off and approval are complete.
- This draft is **not** `docs/CS03_GATEWAY_RATE_LIMIT_ACCEPTANCE.md`; naming is deliberate so the existing guard does not interpret a draft as acceptance.
- No deployment, new billable resource, secret changes or production DB operations are authorized by this document.
