# CS-03 bounded list synchronization — review only (2026-11-24 14:00 JST)

Status: design acceptance contract, not implementation or deployment approval.
Based on current client blob a04e00b82987666bd9bcf6d91e6ae9d13de86f9d and current trusted gateway source, and CS03_CLOUDFLARE_PREDEPLOY_DECISION_20261123.md.

## Decision
Do not simply increase the 65,536-byte gateway response cap or lower the client limit to a fixed small number. The client requests 100 rows, permits 16,000 bytes on save and 16,384 bytes per listed data object; JSON envelope and row metadata also consume bytes. A fixed three-row page would require up to 534 requests for the currently documented 1,600-row UI bound, exceeding the existing 80-page guard and 10/user/minute default quota. A fixed page size alone is not a viable general solution.

Use byte-budgeted pagination at the upstream list producer: serialize the actual UTF-8 response envelope, including metadata and nextCursor, before admitting each row; keep the existing 65,536-byte gateway hard cap, with a proposed producer budget of 60,000 bytes. Preserve existing maximum 100 rows per request. Return a cursor equal to the last emitted row only when more rows remain. Never skip an unreturned row. If even one row cannot fit, fail explicitly; never return an empty nonterminal page. Confirm actual Neon function source and ordering before implementing. No deployed function changes in this work window.

Client must retain a single account-bound in-memory snapshot and cursor across bounded quota waits. On 429 only, retry the same cursor, with a conservative bounded delay (at least the configured quota window unless a trustworthy longer retry hint is available); do not retry 401/409/503 as quota failures. Gateway currently does not expose Retry-After; do not assume it exists. Establish a finite elapsed-time and retry budget, cancellation on account change, and a separate finite page bound derived from the supported maximum row count, not 80 by assumption. Do not publish partial snapshots, reset cursor on 429, weaken shared DO quota, or store JWTs. A long worst-case sync must be surfaced as such, not promised to finish immediately. Concurrent saves during listing require a documented consistency policy; cursor pagination alone is not a transactional snapshot.

## Acceptance cases before cloud approval
- 100 small rows fit, and multibyte/escaped near-limit rows split at the actual serialized byte budget.
- Exact boundary, one byte over, final page, empty account, and single unfit row; no duplicates or omitted records across stable ordered pages.
- 429 midway resumes the identical cursor without partial cache publication; repeated 429 exhausts a finite budget.
- Account switch during wait or response prevents further requests and snapshot publication; 401/503 fail closed.
- 1,600 supported records can be traversed within the explicit page guard; measure elapsed time and quota consumption, including global/IP limits and retries.
- Browser still uses credentials: omit, JWT Authorization, exact CORS, shared DO quota and server-only upstream secret. No Access service token or cookie dependency.
- Existing gateway oversize rejection remains effective. Run local suites after PC returns; no new test execution claimed.

Next: inspect actual upstream list producer and UI snapshot consumer, then implement producer/client changes and regression tests together. Keep cloud configuration, public URLs, CSP, main and Actions untouched. Release remains NO-GO.

## 15:00 producer implementation (unexecuted)
The Neon adapter delegates to server/cs03-runtime.mjs and src/progress-api.js. The existing authenticated transaction selects ordered rows with limit+1. The producer now measures the serialized UTF-8 envelope against 60,000 bytes, returns the last emitted cursor on a split, and fails closed if the first row cannot fit. Added API regression cases for multibyte splitting, continuation and oversized stored row. Existing JWT, RLS transaction, SQL ordering and Worker hard cap remain unchanged. Client quota recovery and page bound are still outstanding; do not deploy this partial change. No local tests run, no cloud changes.
