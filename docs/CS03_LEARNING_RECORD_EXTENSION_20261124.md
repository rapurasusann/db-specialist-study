# CS-03 extension: learning record identity (review only)

2026-11-24. Existing exam IDs unchanged. Vocabulary uses term:<stable original id>. Step-up uses step:<level>:<context code>:<pattern number>. Context codes 1=受注管理, 2=履修管理, 3=在庫管理, 4=従業員技能管理, 5=店舗販売集計. Codes must never be reassigned. No array index as vocabulary identity. No implicit migration of device history.

## Boundaries
All browser, account, draft, reconciliation, server and DB boundaries must accept exactly the same identifiers. Existing account revision/RLS/JWT/DO safeguards unchanged. New content is on main, which has diverged from this branch. UI integration and merge reconciliation remain required. Do not deploy backend or migrate cloud yet.

## Data mapping
Vocabulary: retain attempts, correct, streak, updatedAt; derive level from correct/streak. Step-up: retain status, updatedAt; canonical level mirrors status. AM2: retain existing fields including streak. Dashboard derives metrics from active account snapshot; guest history stays separate. On logout restore guest view; on switch reject stale async responses. Opening a question must read authoritative revision before edits. No automatic upload of existing guest records.

## Capacity
Previous 1600 limit derived from obsolete four-year catalog. Ten years × four courses × 100 maximum + 250 new IDs = 4250 conservative upper bound for currently supported catalog; actual catalog smaller. Keep byte caps and quota limits; do not increase cloud quota. Long sync and cancellation remain separate unresolved issues.

## DB migration
Existing isolated table has a restrictive CHECK. Proposed migration is stored as review-only SQL; verify current constraint definition/name and database before executing with separate approval. Never replace RLS or grant new privileges.
