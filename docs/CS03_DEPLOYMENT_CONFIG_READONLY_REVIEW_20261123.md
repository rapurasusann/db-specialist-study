# CS-03 隔離Worker・Neon接続構成レビュー（2026-11-23）
**判定：NO-GO。静的・読み取りレビューのみ。配置、秘密書込み、課金変更の承認ではない。**

## 照合したソース
- `docs/cs03-worker-config-review-only.json.example`
- `scripts/cs03-worker-review-config.mjs`
- `scripts/cs03-cloudflare-account-guard.mjs`
- `server/cs03-worker-candidate.mjs`
- `server/cs03-gateway-production-adapter.mjs`
- `server/cs03-runtime.mjs`
- `docs/CS03_SECRET_LIFECYCLE_PLAN_20261123.md`

## 1. 現在の構成で確かめられたこと
| 領域 | 根拠 | 静的レビュー結果 |
|---|---|---|
| Cloudflare配置先 | 専用Account IDを `scripts/cs03-cloudflare-account-guard.mjs` に固定、ローカル否定系5/5 PASS | **専用アカウントの前処理チェックは合格**。ただし直接Wrangler、手動配置、別リポジトリを強制停止できない |
| Workerレビュー構成 | `workers_dev:false`、`preview_urls:false`、route/zone/account_idなし | **公開経路なし**。実配置用の公開設定ではない |
| WorkerのDO結合 | `CS03_QUOTA` と `Cs03QuotaNotDeployed`、SQLite class migration | **名称は一致**。クラウド実資源・デプロイ可能性・クォータを保証しない |
| Workerの実行入口 | レビューJSONの `main` は `server/cs03-worker-candidate.mjs`、このモジュールには `default fetch` exportがない | **デプロイ用として未完成**。レビュー構成は変えずNO-GOを維持 |
| 別のWorker入口 | `server/cs03-gateway-production-adapter.mjs` にはdefault exportがあるが、`CS03_ISOLATED_GATEWAY_MODE` と `request.cf` を要求 | モードが欠ける場合503（意図的停止）。`request.cf`のみでは正規Cloudflare経路の暗号学的保証にならない |
| Workerの認証接続 | `CS03_JWKS_URL` / `CS03_JWT_ISSUER` / `CS03_JWT_AUDIENCE` / `CS03_NEON_FUNCTION_URL` | 名前は揃う。実メタデータ・Function URL所有先未照合 |
| Workerの共有秘密 | `CS03_GATEWAY_SECRET` → `x-secret` | 実値は未配置・未照合。秘密登録は別の個別承認を要する |
| Neon Functionの共有秘密 | `CS03_ORIGIN_SECRET` | コード上の一致チェック。実secret store／`process.env`利用可否は実環境未確認 |
| Neon DB隔離 | `server/cs03-runtime.mjs`：非default branch `br-snowy-truth-a162pmdt`、DB `cs03_auth_sandbox`、role `cs03_progress_api`、`sslmode=verify-full` | **意図しないDB接続を拒否する静的ガードあり**。実Function実行環境での接続・資格情報は未検証 |

## 2. 配置前に未解決の具体的な技術条件
1. **実Worker入口の確定**：レビュー専用candidateをそのまま`main`として使わない。将来、正式entrypoint、同一accountのSQLite-backed DO、必要env/secret、正常系と503停止を独立受入。既存ゲートを安易に解除しない。
2. **デプロイ先の強制性**：静的IDガードが通っても実行するWranglerが別アカウントを選べる。将来は専用アカウント限定トークンの権限・所有先を読み取り確認し、他アカウントのトークンを使わない。現時点でトークンを発行しない。
3. **Function配置先の実在**：隔離branchのNeon Functions 0件。接続URLを推測して設定しない。専用プロジェクト・branchへの実配置後に所有権を読み取り確認する。
4. **最小権限**：Workerの秘密 `CS03_GATEWAY_SECRET` とFunctionの秘密 `CS03_ORIGIN_SECRET` は同一値・32 UTF-8 bytes以上とするが、ユーザーJWTとDB RLSを省略しない。DB資格情報はNeonの隔離branch / DB / roleだけに使用する。
5. **無料枠と遮断**：Workers / Durable Objectsは専用アカウントでFree tierを画面確認済み。これは絶対0円保証ではない。route利用時のfail-open迂回を禁止し、採用する最終経路でのfail-closedを実測してから公開可否を判断。現時点ではrouteなし。
6. **安全停止**：公開プレビューOFF、Workerの503、Functionの秘密不一致401、DO故障時503、未保存下書き保持を一つの復旧手順で検証する。Worker停止だけでFunctionへの直接アクセス遮断が完了したとはみなさない。
7. **実配置の個別承認**：Cloudflare/Neonでの生成・設定、秘密登録、公開URL、DNS/route、課金変更、本番`main`更新、GitHub Actions実行は今回一切行わない。

## 3. 最終的な作業順序
- **今進められる**：実配置用entrypointの仕様、必要なsecret/env/bindingの一覧、最終公開経路の方式選定、失敗時の停止・戻し方を静的レビュー。
- **個別承認を要する**：専用CloudflareアカウントへのWorker/DO作成と隔離Neon Functions配置、秘密登録、実接続と障害試験。
- **さらに別承認**：ブラウザCSP/API URL・公開プレビュー変更、本番サービス公開。

**前段の合格済み5件＋11件を無条件に再試験しない。実装が変更された関連部分だけ再受入する。判定NO-GOを維持。**
