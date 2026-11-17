# CS-03 隔離API実装 (2026-11-17)

- `src/progress-api.js`: 認証済みユーザーの履歴のGET/PUT処理。未認証ではDB接続しない。
- `src/neon-jwt-verifier.mjs`: EdDSA、署名、発行元・利用対象、期限等の検証。
- `server/cs03-runtime.mjs`: 試験用ブランチ・DB・最小権限ロール以外では起動拒否。**本番では使用しない固定値**。
- `tests/progress-api.test.js`: JWTを模擬したトランザクション・なりすまし・競合検証。**実DBとの一気通貫検証は未実施**。

最小権限ロール `cs03_progress_api` は、DB自身を信用できる本人確認手段とはしない。検証済みJWTから取得した本人UUIDを、単一DBコネクション内の `BEGIN`→`set_config(..., true)`→パラメーター化SQL→`COMMIT` でRLSに渡す。コネクションは必ず解放する。

アプリ公開・Neon Functionsデプロイは未承認・未実施。試験用DB接続文字列をGitHubにコミットしないこと。環境変数は `CS03_ISOLATED_BRANCH_ID` と `CS03_TEST_DATABASE_URL` のみ。初期状態では環境変数がないため、必ず起動拒否。実DBの接続試験は試験用クレデンシャルを安全に用意した後に行う。

## 実行時注意
`CS03_TEST_DATABASE_URL` は `cs03_auth_sandbox` の `cs03_progress_api`、`ep-dawn-dew-a11prveg` にしか接続させない。誤って資格アプリ本番DBへ接続しないための安全策。クラウド接続情報の表示・ログ出力は禁止。 `npm install --ignore-scripts` で依存を導入し、`node --test tests/progress-api.test.js tests/progress-access.test.js tests/neon-jwt-verifier.test.mjs` を実行する。
