# CS-03 shared-rate-limit provider shortlist (2026-11-23)

Status: EVALUATION ONLY. No provisioning, deployment, billing changes, or approval.

## Requirements
- Zero additional cost, with explicit Free-plan configuration and fail-closed quota exhaustion.
- Atomic global + per-trusted-IP + per-authenticated-user counters across gateway instances.
- Fixed trusted entrypoint, no browser-visible secrets; server-side signed JWT validation.
- No changes to production Neon data, no use of paid tiers, and no weakening of deployment blockers.

## Option A: Cloudflare Workers Free + SQLite-backed Durable Object
- Official docs: Workers Free 100,000 requests/day; Durable Objects Free 100,000 requests/day and 13,000 GB-s/day; SQLite storage Free 5 million rows read/day, 100,000 written/day, 5 GB total.
- Durable Objects available on Free only with SQLite-backed storage. Free-tier operations above quotas fail instead of silently billing.
- A single strongly coordinated Durable Object can serialize atomic quota decisions; implement a single shard for global limits or a proven atomic coordination protocol. Design for throughput and hot-key behavior.
- Workers Free exhaustion must be configured to **fail closed**, not bypass protection.
- Verify that existing Cloudflare account/Workers settings allow deployment without upgrading; other projects sharing account quotas must be included in calculations.
Sources:
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/durable-objects/platform/pricing/
https://developers.cloudflare.com/durable-objects/platform/limits/

## Option B: Upstash Redis Free
- Official pricing currently advertises $0/month, 500K commands/month, 250MB free storage (tables also show 256MB), and 10GB monthly bandwidth.
- Redis scripting/atomic transactions could implement the quota check. Requires a separate third-party processor, network trust review, and free-tier availability/usage monitoring.
- Stay on Free only; do not enter payment information or enable pay-as-you-go.
Source: https://upstash.com/pricing/redis

## Preliminary choice
**Cloudflare Workers Free + SQLite-backed Durable Object** is the preferred architecture for a future isolated proof of concept, because it can keep gateway and distributed quota coordination within one existing provider and has documented Free-plan hard failures. This is not deployment approval.

## Outstanding checks / blockers
1. Confirm Cloudflare account plan, per-account combined resource usage, fail-closed behavior, and whether the Free-plan deployment can be created without billing changes.
2. Confirm Durable Object atomic operations under concurrent calls and across gateways and restarts; persist quota window state so restarts do not reset quotas.
3. Prove bounded operation counts/CPU/storage and no external paid dependencies.
4. Build separately from the existing Node.js prototype; Workers runtime compatibility, JWT verification, secrets and forwarded IP must be tested.
5. Implement isolated fail-closed deployment with rollback and real traffic tests, then seek explicit approval. Existing `TRUSTED_GATEWAY_NOT_IMPLEMENTED` and `ISOLATED_DEPLOYMENT_APPROVAL_MISSING` must remain active.

Do not rename this evaluation to an acceptance/approval document.
