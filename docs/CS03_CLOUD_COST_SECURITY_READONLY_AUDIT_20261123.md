# CS-03 実クラウド接続前のセキュリティ・無料枠監査（読み取り専用）
日付: 2026-11-23 / 判定: **NO-GO（配置・課金変更・本番切替禁止）**

## 1. 実アカウントで確認できたこと（Neon Connectorのread-only取得）
- Project: `quiet-mouse-39990305`（certification-study）、Region: aws-ap-southeast-1、PG18。
- Account/organization plan: `free_v3`。Project DBのbranch logical size limit: `1,073,741,824 bytes`（1 GiB）。これは現時点でこのプロジェクトに表示された制限であり、他プロジェクトの残枠を意味しない。
- Project compute time: `3,452 seconds`、active time `13,460 seconds`、data transfer `2,307,164 bytes`。取得された消費期間は `2026-11-11T12:41:57Z` ～ `2026-12-01T00:00:00Z`。これらをCU-hoursや請求額と混同しない。
- `br-snowy-truth-a162pmdt`（cs03-auth-isolation-20261117）はready／**非default**。logical size `40,706,048 bytes`、compute time `2,599 seconds`。
- default branch `br-nameless-pond-a1ucyf2q` はready、logical size `32,292,864 bytes`。両者の容量を足して請求対象容量と断定しない。
- 対象隔離branchに配置されたNeon Functionsは **0件**。実HTTPS→Neon Functions→DBの試験はまだ実行不可。

## 2. ソース照合（実配置前に要確認）
| 項目 | 読み取り結果 | 判定 |
|---|---|---|
| `src/cs03-account-client.mjs` | ブラウザはJWTを送信。サーバー秘密を含めない | 設計上整合 |
| `server/cs03-trusted-edge-gateway.mjs` | JWTを検証し、`x-secret` と `Origin` を上流に付加。PUT本体は20,000 bytes上限でストリーム読取 | ローカル候補のみ |
| `functions/cs03-progress.mjs` | `x-secret`、固定Origin、JWTを要求。秘密は `CS03_ORIGIN_SECRET` | コード上の防御あり、未配置 |
| `server/cs03-worker-candidate.mjs` | Worker側の `CS03_GATEWAY_SECRET` と隔離Neon Function URLを利用 | **両環境の秘密値の一致／保存先／ローテーションは未確認** |
| `server/cs03-gateway-production-adapter.mjs` | 独立のモードガードと `request.cf` 存在確認。いずれもCloudflareからの真正な到達保証ではない | **実運用Ingressの検証待ち** |
| `server/cs03-shared-quota.mjs` とDO関連 | 全体・IP・ユーザーを1つのDOに集約し原子的制限を試みる | ローカル模擬PASS、クラウド同時実行は未確認 |
| `docs/cs03-worker-config-review-only.json.example` | `workers_dev:false`、`preview_urls:false`、routeなし、SQLite DO bindingあり | 非公開レビュー設定。実デプロイ設定ではない |
| `scripts/cs03-predeploy-guard.mjs` | 認証・レート上限の独立受入および配置承認なしで停止 | **NO-GO維持** |

注意：Workerが必要とする `CS03_GATEWAY_SECRET` とFunctionが要求する `CS03_ORIGIN_SECRET` は環境変数名が異なる。**同じ32 bytes以上の共有秘密を安全に配布する設計の確認が必要**。秘密はブラウザ・GitHub・ログに書かない。共有秘密の名前差自体が現在の障害であると断定しない。

## 3. 無料枠（公開資料と実アカウントを分離）
- Cloudflare Workers Freeの公表制限は**100,000リクエスト/日/アカウント**、UTC 00:00リセット。別サービスの使用分を含む。Gatewayの既定60回/分は**1日上限や課金停止機能ではない**。
- Worker Routesにおいて無料枠超過時にfail-open（Workerを迂回）かfail-closed（1027）の挙動がある。セキュリティ中継は**fail-closed必須**。今は実ルートがないため確認不能。
- SQLite-backed Durable ObjectsはFree枠対応だが、リクエスト・GB-s・行読み書き・保存容量など別枠があり、上限超過では可用性が低下する。Workerだけのリクエスト件数を監視しても不十分。
- Neon Freeの公開プラン情報は2026年11月に改定がある。**このプロジェクトは現時点でFree/branch limit 1 GiB**と直接取得した内容を優先し、CU時間の換算や残枠を推測しない。
- CloudflareアカウントのWorkers/DO現在の全体利用、実ルートfail mode、課金モードは**今回直接取得できていない**。過去のダッシュボード観測（Workers Free $0、当時0/100,000）は「当時」の証拠であり、現在値ではない。

公式参考:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://neon.com/docs/introduction/plans

## 4. なお必要な工程（承認前と承認後を区別）
1. **承認前（安全に進行可）**：固定上流URL/JWKS/issuer/audienceの突合、Worker秘密→Function秘密の設定手順、DO費用と停止手順の書面化、ローカル負試験の不足洗い出し。
2. **アカウント確認待ち**：Cloudflareダッシュボードで現時点のFree契約、全Workers/DO合算使用、課金/超過時の設定、実ルート用fail-closed選択可能性を確認。設定変更や配置はしない。
3. **明示的な個別承認後のみ**：隔離Functionと専用Workerの実配置、実クラウドで認証・CORS・原子上限・直接アクセス拒否・ログ匿名化・費用の検証。無承認で自動移行しない。
4. **本番公開判断**：上記が受入済みとなり、ブラウザCSP/API URL設定、プライバシー・利用規約その他公開条件を個別確認するまで**NO-GO**。

この監査記録は**配置承認票でも `CS03_GATEWAY_RATE_LIMIT_ACCEPTANCE.md` でもない**。GitHub Actionsは実行しない。本番 `main`、Neon DB、Cloudflareのリソース、課金設定は変更しない。
