# CS-03 隔離API実装 (2026-11-17)

- `src/progress-api.js`: 認証済みユーザーの履歴のGET/PUT処理。未認証ではDB接続しない。
- `src/neon-jwt-verifier.mjs`: EdDSA、署名、発行元・利用対象、期限等の検証。
- `server/cs03-runtime.mjs`: 試験用ブランチ・DB・最小権限ロール以外では起動拒否。**本番では使用しない固定値**。
- `tests/progress-api.test.js`: JWTを模擬したトランザクション・なりすまし・競合検証。**実DBとの一気通貫検証は2026-11-18に実施し PASS**。

最小権限ロール `cs03_progress_api` は、DB自身を信用できる本人確認手段とはしない。検証済みJWTから取得した本人UUIDを、単一DBコネクション内の `BEGIN`→`set_config(..., true)`→パラメーター化SQL→`COMMIT` でRLSに渡す。コネクションは必ず解放する。

アプリ公開・Neon Functionsデプロイは未承認・未実施。試験用DB接続文字列をGitHubにコミットしないこと。環境変数は `CS03_ISOLATED_BRANCH_ID` と `CS03_TEST_DATABASE_URL` のみ。初期状態では環境変数がないため、必ず起動拒否。実DBの接続試験は試験用クレデンシャルを安全に用意した後に行う。

## 実行時注意
`CS03_TEST_DATABASE_URL` は `cs03_auth_sandbox` の `cs03_progress_api`、`ep-dawn-dew-a11prveg` にしか接続させない。誤って資格アプリ本番DBへ接続しないための安全策。クラウド接続情報の表示・ログ出力は禁止。 `npm install --ignore-scripts` で依存を導入し、`node --test tests/progress-api.test.js tests/progress-access.test.js tests/neon-jwt-verifier.test.mjs` を実行する。

## 実JWT→API→隔離DB E2E 結果（2026-11-18）

ユーザーの開発PCで `scripts/cs03-real-api-db-e2e.mjs` を実行。接続前の診断で `URL_PARSE`、`BRANCH_MARKER`、`SCHEME`、`DB_NAME`、`ROLE_NAME`、`ENDPOINT_PREFIX`、`ENDPOINT_REGION`、`PASSWORD_PRESENT`、`RUNTIME_INIT` がすべてPASS。実JWT検証 `JWT_A_VERIFY=PASS`。

実DBを使った8項目:
- `A_SAVE=PASS`
- `A_READ_OWN=PASS`
- `B_CANNOT_READ_A=PASS`
- `B_CANNOT_SPOOF_GET=PASS`
- `B_WRITES_OWN_DESPITE_SPOOFED_USERID=PASS`
- `A_UNCHANGED_AFTER_B=PASS`
- `ANONYMOUS_DENIED=PASS`
- `FORGED_TOKEN_DENIED=PASS`

結果 `CS03_LIVE_E2E=PASS` / `TEST_EXIT_CODE=0`。開発PCでNode.jsから直接隔離DBへ接続するAPIハンドラのE2Eであり、公開サーバー経由の実運用E2Eではない。試験用Neon Authアカウント2件と履歴2件を追加。検証用データの削除は別工程。

注意: `pg-connection-string` が `sslmode=require` の互換動作について将来のセキュリティ挙動変更を警告した。現行バージョンでのE2E PASSに影響はないが、今後は `sslmode=verify-full` を明示して再検証すること。

次: パスワード非表示での接続設定・証跡管理、SSLモード厳密指定、公開APIの認証/CORS/濫用対策、ブラウザでの登録・ログイン・ログアウト・永続化、マルチデバイス同期の試験。正式公開とPR統合は未承認のまま。

## TLS接続の明示的な受入条件（2026-11-18）
`pg` は `sslmode=require` 等の将来の互換性警告を表示する。これを曖昧にせず、試験用実行環境の開始条件を `sslmode=verify-full` に固定した（`server/cs03-runtime.mjs`）。`uselibpqcompat` 等の上書き設定も拒否する。

`scripts/cs03-check-db-config.mjs` はオフラインで同条件を検証する。`scripts/cs03-live-tls-check.mjs` は**読み取り専用**で実接続後に `current_database()`、`current_user`、`pg_stat_ssl` の自セッションを照合する。秘密情報は出力しない。追加のNeon Authアカウントは作らない。

追加単体テスト `tests/cs03-runtime-ssl.test.mjs` は、必須TLSモード、別DB・別権限ロールの拒否を確認する。これらの新試験はまだ開発PCで未実施。実DB疎通も再試験前。

## SSL確認方式の修正（2026-11-18）
開発PCの実試験で `sslmode=verify-full`、DB接続先、ユーザーロールはPASS。一方 `pg_stat_ssl.ssl` がFALSEとなった。Neonの `-pooler` エンドポイントを経由しており、これは**PostgreSQLバックエンド側**の接続状態であって、必ずしもNode.js→Neonプロキシ間のTLSを証明しない。

`scripts/cs03-live-tls-check.mjs` の合否条件を修正。実際の `pg` 接続 `client.connection.stream` について `encrypted`、`authorized`、ピア証明書の存在、`tls.checkServerIdentity(host, peerCertificate)` を検証する。DB側の `pg_stat_ssl` は参考値として出力するのみ。接続情報/証明書全文は表示しない。

新方式の開発PC試験は後続の「SSL実接続の最終判定」のとおり PASS。

## SSL実接続の最終判定（2026-11-18）

開発PCで `scripts/cs03-live-tls-check.mjs` を実行。

- `URL_PARSE`、`BRANCH_MARKER`、`SCHEME`、`DB_NAME`、`ROLE_NAME`、`ENDPOINT_PREFIX`、`ENDPOINT_REGION`、`PASSWORD_PRESENT`、`SSL_VERIFY_FULL`、`RUNTIME_INIT`: すべて PASS。
- `RUNTIME_CONFIG`、`DATABASE_IDENTITY`、`ROLE_IDENTITY`: PASS。
- `CLIENT_TLS_ENCRYPTED`、`CLIENT_TLS_CERT_AUTHORIZED`、`CLIENT_TLS_PEER_CERT`、`CLIENT_TLS_HOSTNAME`: すべて PASS。
- `PG_BACKEND_SSL=FALSE` は Neon -pooler のバックエンド側セッションの観測値であり、クライアントのTLS検証の代替としない。
- `CS03_TLS_LIVE=PASS`、`TEST_EXIT_CODE=0`。

**SSL工程は隔離DBへの開発PC接続という範囲で CLOSED。** 公開APIの本番TLSやブラウザ→API間のCORS/認証/通信は別途要検証。

## ブラウザ向けFunctions入口（2026-11-18、未デプロイ）
`functions/cs03-progress.mjs` を追加。GitHub Pagesの固定オリジン `https://rapurasusann.github.io` のみCORS許可。ブラウザpreflight `OPTIONS` 応答、`GET/PUT` のみ、`Authorization: Bearer` 必須、JSONと上限チェック、`Cache-Control: no-store`。実際のJWT/DB権限判定は `src/progress-access.js` と `src/neon-jwt-verifier.mjs`、RLSに委任する。`Origin` は偽装可能であるためセキュリティ上の本人確認とは見なさない。

`tests/cs03-browser-function.test.mjs` を追加、`npm run test:cs03` に編入。**未実行**。

**デプロイ禁止の現時点のブロッカー**: Neon Functionsで自動注入される `DATABASE_URL` のロール/DBは必ずしも `cs03_progress_api/cs03_auth_sandbox` ではない。本入口はデフォルト接続URLを使わず、別途安全なサーバー環境変数 `CS03_TEST_DATABASE_URL` が必要。ブランチID環境変数 `CS03_ISOLATED_BRANCH_ID` も必要。これらなしでは初期化拒否。FunctionのネイティブURLは公開されるため、JWT認証に加え、正式公開前にエッジ側で適切な濫用防止・レート制御、応答制限、費用/無料枠監視が必要。ユーザー登録・ログイン・セッション維持・同期は未実装。Neon Functionsの無料プラン利用可能性は確認済み、ただし実際の利用量は未計測。

## ブラウザAPIのローカル試験結果（2026-11-18）
開発PCでコミット `09a3160` に対して `npm run test:cs03` 実行。
結果 `54 tests / 54 pass / 0 fail / TEST_EXIT_CODE=0`。
内訳: ブラウザFunctions入口 13/13、SSLランタイム10/10、JWT10/10、ユーザー別アクセス制御9/9、学習履歴API12/12。
Neon Functionsデプロイは行っていないため、実行時の環境変数、CORS経由の公開アクセス、JWTの実運用レート制御は未検証。ネイティブURLへの匿名リクエストにも関数起動コストが生じ得る。無料枠の利用量を確認し、厳密なDBロール設定/公開対策/料金リスクを検証するまで公開しない。

## Neon Functions デプロイ前ゲート (2026-11-18)
Neon Connectで対象プロジェクトが `free_v3`、`aws-ap-southeast-1` であることを確認。隔離ブランチのFunction一覧は空で、未デプロイ。Neon公式（2026-11-10）でFree Functionsは月100万invocations、10 active / 400 waiting Capacity-hoursを含む。ただし実料金/上限消費と匿名連続アクセスによる起動数増加は運用上のリスク。

`scripts/cs03-predeploy-guard.mjs` はネットワーク接続せず、プロジェクトID、試験ブランチID、明示承認マーカー、最小権限のDBロール/試験DB名/エンドポイント、TLS verify-full、パスワード存在を照合し、誤接続なら拒否する。CLIには `npm run check:cs03-deploy` を用いる。必要な環境変数 `NEON_PROJECT_ID=quiet-mouse-39990305`, `NEON_BRANCH_ID=br-snowy-truth-a162pmdt`, `CS03_ISOLATED_BRANCH_ID=br-snowy-truth-a162pmdt`, `CS03_DEPLOY_OPT_IN=ISOLATED_ONLY`、`CS03_TEST_DATABASE_URL`。秘密は絶対にGitHubやチャットへ送信しない。これらはデプロイ実行コマンドではなく検査条件の設計であり、実際のNeon Functionsデプロイ操作は**まだ実装/実施していない**。

`tests/cs03-predeploy-guard.test.mjs` の12ケースを既存 `npm run test:cs03` に追加。**まだ開発PCで実行していない。** 現在のFunctionには共有的な厳密レート制限/WAFがないため、公開前の濫用防止と利用量監視が別途必要。Origin/CORSは本人確認にはならない。

## デプロイ前安全テストの実行結果（2026-11-18）
開発PCで、開発ブランチのコミット `2d22616` に対して `npm run test:cs03` を実行。
- `tests=66`、`pass=66`、`fail=0`、`TEST_EXIT_CODE=0`
- ブラウザAPI 13/13、デプロイ前ガード 12/12、SSLランタイム 10/10、JWT 10/10、アクセス制御 9/9、学習履歴API 12/12。
- これはローカルでの模擬試験。公開エンドポイント・料金/呼び出し枠・実デプロイの動作は未確認。

次のゲート：Neon Functionsにデプロイするコードの配布物と環境変数の仕様確認、最小権限のDB接続文字列のサーバー内設定、実HTTP通信試験、料金発生防止の運用策。事前に実証できていないコスト抑止策を「完了」と扱わない。デプロイ操作とGitHub Actions実行は未実施。

## 公開API入口の追加防御（2026-11-18、未実行）
Neon公式の Production hardening で、FunctionのネイティブURLはWAF/Cloudflare経由のドメイン追加後も外部から直接到達でき、Function内の401応答でも呼び出し消費が発生することを確認。CORS/Origin検査は認証またはコスト防止策ではない。

`functions/cs03-progress.mjs` にサーバー専用 `CS03_ORIGIN_SECRET` と `X-Secret` の定数時間比較を追加。秘密鍵が未設定・32バイト未満・ヘッダー不一致の場合、DBやJWT検証より前に401。GET/PUTのみ適用し、ブラウザのOPTIONS preflightは従来どおり（それ自体もFunctionへの呼び出しに数えられる）。秘密鍵はブラウザのJS・GitHub・クエリ文字列には公開しない。

`scripts/cs03-predeploy-guard.mjs` も秘密鍵32バイト以上を要求。テスト `tests/cs03-browser-function.test.mjs` に4件、`tests/cs03-predeploy-guard.test.mjs` に2件を追加（従前66件＋6件＝**72件、未実行**）。

**ブロッカー継続**: Workerなどの信頼できる中継入口、エッジ側のレート制御・濫用防止、利用量を確認する運用が未実装。これらが揃うまでFunctionはデプロイしない。Neonの「公開ネイティブURLの呼び出し自体に確実な無課金上限をかける手段」は未実証。Function内の秘密鍵チェックだけで追加料金ゼロを保証しない。

## ゲートウェイ秘密鍵追加後のローカル試験結果（2026-11-18）
開発PCでコミット `546610d` に対して `npm run test:cs03` 実行。
結果：`tests=72`、`pass=72`、`fail=0`、`CS03_TEST_EXIT_CODE=0`。
内訳：ブラウザFunctions入口17件、デプロイ前ガード14件、SSL10件、JWT10件、ユーザー別アクセス制御9件、学習履歴API12件。
これはローカル試験のみ。隔離Functionの実デプロイと公開HTTPアクセス、無料枠の運用監視は未実証。ネイティブURLへのリクエストは秘密鍵による401でも関数呼出しとして計上され得る。次工程では、これ以上セキュリティガードだけを増やすのではなく、ユーザー登録・ログイン・学習履歴同期のクライアント統合を並行して進め、デプロイ可否は明示的な費用上限保証を確認してから判断する。
