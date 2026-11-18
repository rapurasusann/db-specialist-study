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

## ブラウザ側アカウント・学習履歴コーディネータ（2026-11-18）
`src/cs03-account-client.mjs` を追加。Neon Managed Authの `signUp.email`、`signIn.email`、`getSession`、`token`、`signOut` を注入して使用する。ユーザーUUIDで端末内の新規保存キー `db-study-cs03-progress-<userUUID>` を分離。パスワード/JWTは端末内の学習履歴保存先に書かない。学習記録は問題ID単位に `GET/PUT /progress` へ送受信、楽観的リビジョン競合では再取得後に上書きを拒否する。HTTPと認証情報付きURLは拒否。

`tests/cs03-account-client.test.mjs` に登録・ログイン・復元・アカウント分離・保存・取得・競合・誤設定の9件を追加し `npm run test:cs03` に組み込み。従前72件＋9件＝**81件（未実行）**。

**重要な未完了**: 現行 `index.html` は従来のSupabase向け無効な同期欄と端末共通 `db-study-progress-v1` を持つ。今回の新モジュールはまだ画面に組み込んでいないため、ユーザー向けログイン画面と端末間同期は未完成。既存localStorageを新アカウントに自動統合しない（誤アカウントへの混入防止）。Neon Auth SDKの実ブラウザ接続、CSP、信頼済みドメイン、メール認証/SMTP、公開API経由の動作は別途確認する。Neon Functionは未デプロイ。

## 81件試験の初回実行・テスト記述修正（2026-11-18）
開発PCでコミット `ac130a8` に対し `npm run test:cs03` を実行：`tests=81`、`pass=80`、`fail=1`。失敗は `tests/cs03-account-client.test.mjs` の `assert.doesNotMatch(...,'jwt-a')` に文字列を指定したためで、Node.jsのassert APIが要求するRegExpではなく `ERR_INVALID_ARG_TYPE` となった。新しいアカウント・履歴の動作不良を示すものではない。
修正コミット `e4b9ff6` で `/jwt-a/` に修正。**修正後の81件再実行は未実施**。ローカル試験合格の判定は再実行結果待ち。デプロイと既存画面の改修は未実施。

## 81件再実行・画面統合作業（2026-11-18）
開発PCでコミット `485ab1f` に対して `npm run test:cs03` を再実行し `tests=81 / pass=81 / fail=0 / CS03_TEST_EXIT_CODE=0`。前回のassert引数の誤りは解消。

既存 `index.html` に `cs03AccountPanel` を追加（ユーザー登録／ログイン／ログアウト／状態表示）。`cs03-config.js` は `previewEnabled:false` が初期値。プレビューローダーは有効化されるまで機能本体のバンドルを要求しない。これにより現行の問題表示、画像表示、端末内履歴、従来のSupabase用同期コードは変更しない。

`src/cs03-account-ui.mjs` はNeon Authクライアントを注入するフォーム操作制御で、入力・登録・ログイン・ログアウト・状態復元を実装。自動移行・自動同期は意図的に禁止し、別アカウントへの旧履歴混入を防ぐ。`src/cs03-account-entry.mjs` とビルド用 `npm run build:cs03-account` を追加。ブラウザ用バンドル `src/cs03-account.bundle.js` はまだ生成・配備していない。

`tests/cs03-account-ui.test.mjs`（6件）と `tests/cs03-page-integration.test.mjs`（4件）を `npm run test:cs03` に追加。既存81件＋新10件＝**91件、未実行**。

**公開前残条件**：`@neon/auth` のブラウザバンドル生成と実動作確認、CSPの `connect-src` を実際の信頼済みAuth/API接続先だけに絞った調整、Authのtrusted domains、隔離Functionの費用・アクセス制限、学習画面の保存イベントとアカウント履歴の安全な連携、PC・スマホの同期E2E。現時点では開発ブランチのUI部品が増えただけで、実際の登録・ログインや同期はまだ使えない。Neon Functionのデプロイは未実施。

## 開発PC 91件ローカル試験（2026-11-18）
コミット `82be2d5` に対する `npm run test:cs03` の実行結果：91 tests / 91 pass / 0 fail / `CS03_TEST_EXIT_CODE=0`。追加分はアカウントフォーム6件、既存ページ維持4件。ブラウザバンドルはまだ未生成で、実ブラウザでのNeon Auth通信・画面操作は未確認。次は依存導入と `build:cs03-account` のローカル検証。公開デプロイ・Actionsは禁止したまま。

## ブラウザバンドル・ローカル表示スモーク（2026-11-18）
開発PCにてコミット `6b5035a` から `npm install --ignore-scripts --no-audit --no-fund` が成功（追加28パッケージ）、`npm run build:cs03-account` 成功（約1.1 MBのバンドル）、`CS03_ACCOUNT_BUILD=PASS`。ビルド成功はブラウザ実動作・Neon Auth接続成功を意味しない。

` scripts/cs03-browser-smoke.mjs` を追加。開発PC内の127.0.0.1で一時HTTP配信し、Playwright Chromiumでページタイトル、学習・バックアップ操作の表示、アカウント試験パネルの初期非表示、プレビューOFF、ページスクリプトエラーなし、ビルド成果物の存在を確認する。外部通信はPlaywright側で遮断する。ログイン・ユーザー登録・Neonとの通信は行わない。**スモーク試験は未実行。** GitHub Actionsと公開デプロイは未使用。

## 開発PC ブラウザ表示スモーク結果（2026-11-18）
コミット `0b3a216` にて、ローカルPlaywright Chromium + 127.0.0.1の一時配信による `scripts/cs03-browser-smoke.mjs` を実行。結果：`BUNDLE_EXISTS=PASS`、`PAGE_TITLE=PASS`、`LEGACY_STUDY_VISIBLE=PASS`、`LEGACY_BACKUP_VISIBLE=PASS`、`ACCOUNT_PANEL_DEFAULT_HIDDEN=PASS`、`PREVIEW_DISABLED=PASS`、`NO_PAGE_SCRIPT_ERRORS=PASS`、`CS03_BROWSER_SMOKE=PASS`、`CS03_BROWSER_TEST_EXIT_CODE=0`。外部通信遮断。これは**アカウント機能OFF状態のブラウザ表示スモークのみ**で、登録・ログインUIの実表示、Neon Authとの通信、端末間同期は未検証。

次に、APIへの接続を行わない隔離プレビューの実表示・入力・ログアウト・非干渉試験を整備する。既存の学習履歴（`db-study-progress-v1`）には手を加えない。本番反映/Neon Functionsデプロイ/GitHub Actionsは未実施。

## ブラウザによるアカウント画面の実操作試験（2026-11-18、未実行）

`scripts/cs03-account-browser-ui.mjs` を追加。Playwright Chromiumで開発PCのループバック配信を開き、実際の `src/cs03-account-ui.mjs` を動的import、試験用の偽認証オブジェクトを注入して、非表示→試験欄表示→ユーザー登録→パスワード消去→ログイン→状態復元→ログアウトをUI操作で確認する。ブラウザのネットワークリクエストは127.0.0.1の当該サーバー以外すべて遮断し、Neon Auth、DB、公開API、外部サイトには接続しない。

`db-study-progress-v1` にサンプル学習履歴を事前保存し、全操作後に同一内容のままかを比較する。新規のブラウザ操作試験は**未実行**であり、動作合格は結果待ち。Neon Authの本物のユーザー登録/ログイン、公開APIへの保存、端末間同期はまだ対象外。

既存の81件/91件のテストとローカル非表示スモークは合格済み。試験データを実環境へ書かない。本番反映、Neon Functionsデプロイ、GitHub Actionsは実施しない。

## 開発PC実ブラウザ・アカウント操作試験結果（2026-11-18）
コミット `5977f7f` の `scripts/cs03-account-browser-ui.mjs` をPlaywright Chromiumで実行し、以下すべてPASS：`ACCOUNT_DEFAULT_HIDDEN`、`ACCOUNT_PANEL_VISIBLE`、`SIGNUP_UI`、`PASSWORD_CLEARED_AFTER_SIGNUP`、`LOGIN_UI`、`LOGIN_DISABLES_FORM`、`SESSION_REFRESH_UI`、`LOGOUT_UI`、`LEGACY_RECORD_UNCHANGED`、`NO_EXTERNAL_REQUESTS`、`NO_PAGE_ERRORS`。
総括 `CS03_ACCOUNT_BROWSER_UI=PASS` / `CS03_ACCOUNT_BROWSER_EXIT_CODE=0`。偽認証を使ったUI操作であり、本物のNeon Authログイン・公開API・マルチデバイス同期は未検証。
次工程はNeon Auth実認証の隔離試験。課金・本番反映・GitHub Actions実行は引き続き禁止。

## Neon Authの隔離ブランチ設定の読取確認・実通信ゲート（2026-11-18）

Neon APIで隔離ブランチ `br-snowy-truth-a162pmdt` のAuth設定を読み取り確認。対象DB `cs03_auth_sandbox`、Managed Better Authが有効、メール/パスワード認証 `enabled=true`、新規登録 `allow_sign_up=true`、メール確認 `require_email_verification=false`、`allow_localhost=true`、登録済み信頼済み外部originは空、メール送信元はNeon共有SMTP。**設定の変更は一切実施していない**。

`scripts/cs03-neon-auth-live-preflight.mjs` を追加：特定の隔離Authの公開JWKSに限りHTTPS GET（リダイレクト禁止）し、HTTP 200、公開鍵配列、秘密鍵パラメータの不在を検査する。**試験未実行**。本試験はユーザー登録・メール送信・ログイン・DB変更をしない。まず接続先の真正性・疎通を確認してから、本物のユーザーを作成する必要がある隔離認証試験へ段階的に進む。

既存のCS03画面CSP `connect-src 'self'` と `cs03-config.js` の `previewEnabled:false` は維持。実Neon Authへのブラウザからの接続はまだ有効化していない。公開デプロイ、GitHub Actions、Neon Functionsデプロイは未実施。

## 隔離Neon Authの実ブラウザE2Eスクリプト（2026-11-18、未実行）

`scripts/cs03-neon-auth-real-browser.mjs` を追加。開発PCの一時localhostサーバーだけでCSPを隔離Authドメイン向けに緩和し、`cs03-config.js` のレスポンスをローカルのみプレビューONに差し替える。ブラウザ内でテスト専用ランダムなexample.comメールとランダムパスワードを生成し、Neon Auth隔離ブランチ `cs03_auth_sandbox` に実際の登録・ログイン・画面再読み込みによるセッション復元・ログアウトを試験する。認証ドメインとローカル以外の外部通信は遮断。テストパスワード・JWT・メールはGitHubに書かない/標準出力に出さない。GitHub Pagesの本番JS/CSP/設定は変更しない。学習履歴APIには接続しない。

実行は `CS03_REAL_AUTH_OPT_IN=ISOLATED_TEST_USER` の明示指定必須。これは**実際に隔離環境へ試験用ユーザーを1件作成する操作**であり、偽認証試験とは異なる。試験後のアカウント削除は自動実行しない。共有SMTPは登録時メール確認が必須でない設定であることをAPIで確認済み。ただし配送有無・ブラウザCORS・実セッション維持は**未検証**。

ステップ1 `scripts/cs03-neon-auth-live-preflight.mjs`（JWKS公開接続・副作用なし）、ステップ2 `scripts/cs03-neon-auth-real-browser.mjs`（隔離環境にテストユーザー作成）で進む。両方まだ未実行。Neon Functionsデプロイ・GitHub Actions・公開アプリへの変更は禁止のまま。

## 隔離Neon Auth 実ユーザー登録E2Eの初回失敗（2026-11-18）
開発PCでコミット `0a0453e` の試験を実行。読み取り専用JWKS HTTPS/HTTP200/公開鍵配列/公開鍵のみ4件すべてPASS、ブラウザ用バンドル/隔離アカウント画面表示PASS。実登録後に想定成功メッセージが確認できず `NEON_AUTH_REAL_SIGNUP=FAIL`、`CS03_NEON_AUTH_REAL_E2E=FAIL`。**登録API側でユーザー作成されたかは不明**、ログイン/セッション復元/ログアウトには未到達。

原因未確定のため同じ登録E2Eを無条件に再実行しない。Neon Auth設定は隔離ブランチのメール/パスワード・新規登録有効、`allow_localhost=true`、trusted_origins=[]。試験サーバーが `http://127.0.0.1:<port>` を使っており、このoriginと `http://localhost:<port>` の区別で失敗する可能性があるが未実証。

`scripts/cs03-neon-auth-readonly-browser-diag.mjs` を追加。両ホスト名でブラウザを起動し、APIの `GET /get-session` と公開 `GET /.well-known/jwks.json` の応答/CORS可否、CSP違反、画面エラーを確認する。**ユーザー登録・ログイン・メール送信・DB更新操作なし**。診断結果を見てから最小修正し、実登録の再試験は無駄なユーザー増加を避けて計画する。本番API/Functions/Actionsの操作なし。

## Neon Auth readonlyブラウザ診断結果・登録失敗の切り分け（2026-11-18）
開発PCで `scripts/cs03-neon-auth-readonly-browser-diag.mjs` を実行：`127.0.0.1` と `localhost` の双方で `GET /get-session`、`GET /.well-known/jwks.json` がHTTP 200、試験パネル表示PASS、CSP違反・JSエラー・外部ブロックは記録なし。`CS03_AUTH_READONLY_DIAG=COMPLETE`。これはGET疎通であって、POST登録の受理を証明しない。

Neon隔離DB `cs03_auth_sandbox` の `neon_auth."user"` を読み取り専用で集計し、`cs03-%@example.com` 形式の試験アカウントが6件存在することを確認（最新作成日時 `2026-11-17T15:08:57.901Z`）。個別試行とユーザーの対応関係は確定できず、失敗したUI試験で作成されたか否かは未断定。既存の試験ユーザーを削除・変更していない。

`scripts/cs03-neon-auth-real-browser.mjs` を修正し、登録APIのHTTPステータス、UIメッセージ分類、Auth通信エラー件数、ページエラー件数を秘密情報なしで出力するようにした。**修正後の実ユーザー登録試験は未実行**。同試験は1実行につき新規ランダムなテストユーザーの作成を試行するため、無条件の再実行は避ける。ログにパスワード、JWT、メールアドレスを出力しない。コードはGitHubに保存したがNeon Functions/公開環境は未変更。

## 登録API 403：実測と安全な修正（2026-11-18）
開発PCの最新実登録試験で `SIGNUP_HTTP_STATUS=403`、`SIGNUP_UI_RESULT=ERROR_MESSAGE`、通信失敗0、ページエラー0、登録テストFAIL。Neon Auth設定は隔離ブランチの `allow_localhost=true`、`trusted_origins=[]`、メール/パスワード新規登録有効。GET疎通が200でも、Better AuthのCSRF/Origin検査があるPOSTが許可されることは意味しない。公式Neon Docsでは未許可Originからのサインイン・サインアップは `INVALID_ORIGIN` で拒否される。

原因の有力候補：E2EテストのURLは `http://127.0.0.1:<動的ポート>` であり、Neonが開発用に許可する `localhost` と同一ではない場合がある。ただし前回403の応答本文エラーコードを記録していないため**原因確定ではない**。

`scripts/cs03-neon-auth-real-browser.mjs` を `http://localhost:<動的ポート>` に固定（サーバー待受はループバック限定のまま）、登録HTTP拒否時は認められた少数のエラーコードだけを表示するよう改善。秘密情報や自由記述エラーメッセージは表示しない。**修正後のテストは未実行**。Neonの設定変更、実DBデータの削除、公開デプロイやGitHub Actionsは未実施。登録試験の再実行は新規試験ユーザー作成を伴う可能性がある。

## 実Neon AuthブラウザE2E 合格（2026-11-18）

開発PCでコミット `3c3903e` の隔離実認証試験を `http://localhost:<一時ポート>` で実行。結果 `SIGNUP_HTTP_STATUS=200`、`SIGNUP_UI_RESULT=SUCCESS_MESSAGE`、`SIGNUP_AUTH_NETWORK_FAILURES=0`、`SIGNUP_BROWSER_PAGE_ERRORS=0`、`NEON_AUTH_REAL_SIGNUP=PASS`、`NEON_AUTH_REAL_LOGIN=PASS`、`NEON_AUTH_SESSION_RESTORED=PASS`、`NEON_AUTH_REAL_LOGOUT=PASS`、`ONLY_ISOLATED_AUTH_NETWORK=PASS`、`NO_BROWSER_RUNTIME_ERRORS=PASS`、`CS03_NEON_AUTH_REAL_E2E=PASS`、`CS03_REAL_AUTH_EXIT_CODE=0`。

`127.0.0.1` の以前の登録HTTP403は、localhostへの切替後200になった。接続元Originの違いが有力原因だが、403応答本文の正確なエラーコードは以前記録していないため厳密な原因特定には至っていない。隔離Authにランダムな試験ユーザー1件が実際に登録された（`TEST_USER_CREATED=YES`）。ユーザー削除はしていない。Neon Functionsや本番アプリには変更なし。

次は、ブラウザの現行学習記録 `db-study-progress-v1` と認証済みユーザー別 `db-study-cs03-progress-<user UUID>` の取り扱いを決めて、既存履歴が誤アカウントへ混入しない安全な保存/取得の接続を実装する。現時点の `src/cs03-account-client.mjs` のGET/PUTキー（`examCode=db`、`questionId=年:科目:番号`、`revision`）は `src/progress-api.js` と形式互換だが、学習ページ側からの呼出しはまだ未接続。公開URLからの学習履歴同期も未実装・未検証。

## アカウント別学習履歴の画面連携に向けた安全な保存レイヤー（2026-11-18）
隔離開発ブランチに `src/cs03-scoped-progress.mjs` を追加。既存 `db-study-progress-v1` を読み込まず、`account.session()` のユーザーUUIDへ明示的に紐付けて保存・取得する。ログイン変更時には別アカウントへの書込みを止め、`unbind()` で紐付けを解除する。GETで当該問題を明示的に読み込む前のPUTを禁止し、先にサーバーからデータを取り直して旧画面の値を暗黙上書きする設計を避けた。競合/保存失敗後は再読込するまで書込み不可。問題IDは既存APIに合わせ `20xx:(am1|am2|pm1|pm2):1..100` のみ。

`tests/cs03-scoped-progress.test.mjs`（10件）を既存 `npm run test:cs03` に追加。対象は旧履歴非混入、A/B分離、読み取り前書込禁止、競合拒否、アカウント切替中の書込禁止、保存失敗後の再読み取りなど。従来91件と合わせて**101件の予定だが、この新テストは未実行**。

**重要：** このモジュールはまだ既存 `index.html` の `progress` 変数や保存イベントに接続していない。別端末の全問同期・安全な本番API配信・UI表示切替は未完成。Neon Functionsデプロイ、公開アプリ変更、GitHub Actionsはいずれも未実施。

## 開発PCで101/101テスト合格（2026-11-18）
隔離ブランチのコミット `ec063ae` で `npm run test:cs03` を実行。101 tests, 101 passed, 0 failed, `CS03_TEST_EXIT_CODE=0`。直前の `github.com` DNS解決失敗は再試行時に解消。安全なアカウント別保存のロジック試験は合格。ただし学習画面との実連携と端末間同期はまだ未実装・未検証。

## 選択中の問題とアカウント履歴の読取専用画面接続（2026-11-18）
`index.html` の初期OFFのCS-03アカウント欄に「選択中の問題のアカウント履歴を取得」ボタンと結果欄を追加。`src/cs03-selected-question.js`（CSPを変更せず従来の学習画面変数から選択中の問題IDだけを取り出す読取専用スクリプト）、`src/cs03-account-entry.mjs`、`src/cs03-account-ui.mjs` を接続。ログイン/セッション復元で `createCs03ScopedProgress().bind()`、ログアウトで `unbind()`、ボタンを押したときだけ該当問題のGETを実行し、記録の習熟度を独立した欄へ表示する。既存の `progress`、`db-study-progress-v1`、問題本文・画像・学習画面の保存イベントは書き換えない。アカウントデータの画面への自動取り込み/自動保存は**まだ行わない**。

`tests/cs03-selected-question.test.mjs` を3件追加し、試験予定数を101→**104件**に更新。**新しいコードと104件試験は未実行**。ブラウザ用バンドルはソース修正後に再ビルドが必要。

注：実APIのHTTPS接続先は引き続き未公開で、現行の `cs03-config.js` は `previewEnabled:false`。読取ボタンも通常画面には表示されない。今回の接続は開発ブランチ内のプレビュー用であり、実Neon DBとのブラウザ通信成功や端末間同期の完成を意味しない。追加料金が発生するサービスの有効化やNeon Functionsのデプロイは行っていない。

## 104件試験・ブラウザ用バンドル再生成（2026-11-18）
開発PCにてコミット `10f1cce` の `npm run test:cs03` を実行し **104 tests / 104 pass / 0 fail**。続けて `npm run build:cs03-account` 成功、約1.1 MBのバンドルを再生成し `CS03_TEST_AND_BUILD=PASS`。

次工程のため `scripts/cs03-selected-history-browser.mjs` を追加（現時点では未実行）。Playwright Chromiumとローカル限定HTTP配信を使い、選択問題IDの読取ブリッジ、アカウント欄初期非表示、ログイン前の履歴ボタン無効、偽認証ログイン後の履歴表示、端末内履歴 `db-study-progress-v1` の不変、ログアウト後の履歴ボタン無効、外部通信とブラウザエラーの不在を調べる。既存のUI/Scoped Progressモジュールを使用するが、偽の履歴サーバーを使うためNeon AuthやNeon DBへの接続・書込は発生しない。試験成功の判定は開発PCでの実行結果待ち。

公開Neon Functions・GitHub Actions・本番環境への反映は実施せず。ブラウザの実サーバーからの履歴取得は、安全なHTTPSゲートウェイが整うまで未着手。

## 選択中の1問の端末内履歴→アカウント明示保存（2026-11-18）
開発PCでブラウザ取得試験を実行し `HISTORY_PANEL_DEFAULT_HIDDEN`、`BRIDGE_CURRENT_QUESTION`、`HISTORY_BUTTON_DISABLED_UNTIL_LOGIN`、`HISTORY_BUTTON_ENABLED_AFTER_LOGIN`、`HISTORY_READ_SELECTED_QUESTION`、`HISTORY_REQUEST_ONCE`、`LEGACY_PROGRESS_UNCHANGED`、`HISTORY_BUTTON_DISABLED_AFTER_LOGOUT`、`NO_NEON_REQUESTS`、`NO_SCRIPT_ERRORS` の10件すべてPASS。`CS03_SELECTED_HISTORY_BROWSER=PASS`、終了コード0。偽認証・ローカル履歴サーバーを使用、実Neon DB通信ではない。

今回のコード変更：初期無効のCS-03プレビュー画面に「選択中の端末内履歴1件をアカウントに保存」ボタンを追加。`src/cs03-selected-question.js` は選択中の1問の端末内記録だけをコピーで渡す。`src/cs03-manual-transfer.mjs` はサーバー上の該当問題を先にGETし、**既存レコードがある場合は上書き禁止**、空であってもユーザーの確認ダイアログで明示承認されるまで保存しない。承認待ちの間に端末内記録が変わった場合も停止。認証済みユーザー専用の `scoped.save()` を使い、サーバー側のrevision競合も上書きせず停止する。旧端末内履歴そのものは変更せず、他の問題は一切コピーしない。

新規ユニットテスト `tests/cs03-manual-transfer.test.mjs` 7件を `test:cs03` に追加。従来104件を含め **111件が今回の実行対象（未実行）**。ブラウザバンドルはソース変更に伴い再ビルドが必要。自動同期・アカウント履歴の学習画面への復元・実APIのHTTPS公開はまだ実装していない。初期設定 `previewEnabled:false` 維持、本番公開・Neon Functionsデプロイ・GitHub Actionsは未実施。

## 開発PCの単体試験111/111合格（2026-11-18）
隔離ブランチのコミット `67b6e31` を取得し `npm run test:cs03` 実行：111 tests / 111 pass / 0 fail。 `npm run build:cs03-account` 実行成功（約1.1 MB）、`CS03_TEST_AND_BUILD=PASS`。選択中1問の明示保存（承認・既存サーバー記録の上書き拒否・変更検出）の7試験が合格した。ブラウザ画面での保存操作E2Eは未実行。

## 明示的保存のローカル実ブラウザ試験追加（2026-11-18、未実行）
`scripts/cs03-manual-transfer-browser.mjs` を追加。Playwrightで元の学習ページとCS-03プレビューUI・`cs03-scoped-progress`・`cs03-manual-transfer` を用い、ログイン前は保存無効、偽認証ログイン後に有効、確認キャンセル時の書込ゼロ、明示承認後の1問だけの保存、端末内履歴の不変、再操作時の既存サーバー履歴上書き拒否、ログアウト後の保存無効、外部通信0・JSエラー0を検証する。**試験は未実行**。試験はローカル偽認証・偽APIのみで実ユーザーや実Neonへの更新を行わず、公開サイトも変更しない。最新111/111のNodeテストとバンドルビルドは開発PCでPASS済み。

## 手動1問保存の実ブラウザ試験結果（2026-11-18）
開発PCでコミット `4b3b3dd` の `scripts/cs03-manual-transfer-browser.mjs` を実行。`MANUAL_TRANSFER_DEFAULT_HIDDEN`、`MANUAL_TRANSFER_DISABLED_BEFORE_LOGIN`、`MANUAL_TRANSFER_ENABLED_AFTER_LOGIN`、`CANCELLATION_NO_REMOTE_WRITE`、`ONE_QUESTION_SAVED`、`LEGACY_PROGRESS_STAYS_UNCHANGED`、`DUPLICATE_REMOTE_OVERWRITE_REFUSED`、`ONLY_ONE_REMOTE_SAVE`、`MANUAL_TRANSFER_DISABLED_AFTER_LOGOUT`、`NO_EXTERNAL_REQUESTS`、`NO_BROWSER_ERRORS` 全11件PASS。`CS03_MANUAL_TRANSFER_BROWSER=PASS`、`CS03_MANUAL_BROWSER_EXIT_CODE=0`。前段111/111ユニット試験PASS。Neon Auth/DBではなくローカルの偽認証・偽保存先を用いたブラウザ試験であり、実APIの公開・端末間同期は未完成。

## アカウント全履歴のページ単位読取（2026-11-18、未試験）
**まず全問一括取得の安全な基盤だけを追加。** `src/progress-access.js` で既存のJWT本人確認を再利用し、`GET /progress?examCode=db&limit=100&cursor=<前ページ末尾の問題ID>` を実装（`questionId` 省略時）。`src/progress-api.js` はサーバー側で `user_id` をJWTから取得し、PostgreSQLの `user_id=$1` / `exam_code=$2` / `question_id>$3` / `ORDER BY question_id LIMIT $4` で必ず最大100件を返す。先読み1行で `nextCursor` を判定し、ページ送りを可能にした。RLSおよびトランザクション内の認証済みユーザーID固定は既存処理を維持。`userId` クエリパラメーターは認証境界を越えない。

`src/cs03-account-client.mjs` に `listProgress()` を追加。ページ送り、悪意あるレコード/重複カーソル/不正なページ応答の拒否、80ページ上限、処理後のアカウント再確認を行う。`src/cs03-scoped-progress.mjs` から本人にバインドして取得するが、旧端末内履歴（`db-study-progress-v1`）にも、アカウント別端末キャッシュにも勝手に反映しない。プレビュー専用アカウント欄に「アカウント全履歴の件数を確認」を追加。ユーザーがボタンを押したときだけ件数を読み込み、結果件数・学習済み件数を表示する。

一覧取得の新規テストは `progress-api.test.js` 4件、`progress-access.test.js` 3件、`cs03-account-client.test.mjs` 3件、`cs03-scoped-progress.test.mjs` 2件、計12件追加。前回111件と合わせ **123件が実行対象（未実行）**。今回のブラウザ用バンドル再ビルドも未実施。本番サイト/Neon Functions/GitHub Actionsへの変更なし。**別端末の履歴を既存の学習画面へ切り替える表示処理や自動同期は未実装。** 公開APIゲートウェイ・無料枠・負荷対策の確認が終わるまで公開は禁止。

## 123件の単体テストとビルドの実行結果（2026-11-18）
開発PCでブランチ HEAD `2353345` を取得し `npm run test:cs03` を実行。`tests 123` / `pass 123` / `fail 0`、続けて `npm run build:cs03-account` が成功し `CS03_TEST_AND_BUILD=PASS`。これにより一覧取得のAPI認可・ページネーション・ブラウザ側読み取りロジックのユニット試験が合格。Playwrightによる一覧取得画面操作、および実Neon API経由での一括取得・複数端末間同期はまだ未実施。

## 全履歴件数表示のローカルブラウザ試験追加（2026-11-18、未実行）
`scripts/cs03-list-progress-browser.mjs` を隔離ブランチに追加。Playwrightで既存ページをローカル配信し、アカウント欄が通常非表示・ログイン前の一覧ボタン無効・ログイン後有効・未操作時には一覧通信なし・クリック時に3件中学習済み2件表示・一覧要求1件だけ・端末内の旧履歴を不変・ログアウト後ボタン無効・外部通信0・ページエラー0を検証する。API/Authは模擬で実Neonの操作なし。新規ブラウザ試験は**まだ未実行**で、実DBからの一覧取得成功やPC/スマホ同期完了は主張しない。

## アカウント履歴の独立した閲覧専用表示（2026-11-18、未試験）
前回の `CS03_LIST_PROGRESS_BROWSER=PASS` はローカルの偽認証・偽履歴データを使う10項目すべてPASS、終了コード0だった。最新コード `81ef235` で合格した実ブラウザ操作であり、実Neon DBの端末間同期は依然未検証。

`src/cs03-history-view.mjs` にアカウント専用の履歴表示処理を新設。`index.html` の初期非表示CS-03プレビュー欄内に `data-cs03="history-list"` の別領域を置き、アカウントの `scoped.list()` から問題ID・理解度・更新番号を最大100行だけ `textContent` とDOM生成で表示する。選択中の問題画像・従来の解答欄・`db-study-progress-v1` は一切書き換えない。ログインユーザーの再バインド、ログアウトでは表示領域を全消去し、取得前に前回内容を消して別アカウントのデータを残さない。これは独立表示のみで、既存学習画面への統合・自動同期ではない。

5件の `tests/cs03-history-view.test.mjs` をテストスイートに追加したため、既存123件に対して**128件が未実行**。`scripts/cs03-history-view-browser.mjs` はローカルの偽API・偽認証でDOMの表の表示、ログアウト時の削除、端末内履歴不変、外部通信なしを確認するが、こちらも**未実行**。バンドルの再ビルドが必要。プレビューは既定OFF、Neon Functions/公開サイト/GitHub Actionsには変更なし。

## ローカル実Neon DBの一覧E2E拡張（2026-11-18、実行待ち）
ブラウザ一覧UI試験は開発PCで `CS03_HISTORY_VIEW_BROWSER=PASS` / `CS03_ALL_CHECKS=PASS`、Node 128/128 PASS、バンドルビルドPASS。ログイン前後、3行の閲覧専用表、ログアウト時の全消去、端末内履歴の不変を確認済み。**実Neon DBの一覧取得試験はまだ実行していない。**

既存 `scripts/cs03-real-api-db-e2e.mjs` に隔離DBでの `A_SECOND_SAVE_FOR_LIST`、`A_LIST_PAGE_ONE`、`A_LIST_PAGE_TWO`、`B_LIST_CANNOT_ACCESS_A`、`A_LIST_UNCHANGED_AFTER_B`、`ANONYMOUS_LIST_DENIED`、`FORGED_LIST_TOKEN_DENIED`、`BAD_LIST_CURSOR_DENIED` の8確認を追加。実Neon Authでランダムな使い捨てユーザー2件を登録し、隔離DBへ新たに3件のテスト履歴を書き込む方式。使い捨てユーザー・履歴は自動削除しないので、事後棚卸対象。既存の実JWT/DB単一問題GET/PUT 8件と合わせ、独立した試験項目を合計16件予定。実行前に `CS03_ISOLATED_BRANCH_ID=br-snowy-truth-a162pmdt` と、`cs03_progress_api` / `cs03_auth_sandbox` / `sslmode=verify-full` の隔離DB URLをマスク入力し、接続先ガードがPASSしない限り起動しない。実ユーザーのDBや本番サイト、Neon Functions、GitHub Actionsは変更しない。出力にパスワード/JWT/DB URLを印字しない。


## 実Neon DB履歴一覧E2E合格（2026-11-19）
開発PCで `scripts/cs03-real-api-db-e2e.mjs` を実行。暗号化保存された接続URLを読み込み、隔離DB `cs03_auth_sandbox` / 最小権限ロール `cs03_progress_api` / `sslmode=verify-full` で実行。`RUNTIME_CONFIG=PASS`、`JWT_A_VERIFY=PASS` に加え、学習履歴の個別保存・取得8件と一覧のページ分割・他ユーザー隔離・未認証/偽造JWT/不正カーソル拒否8件の計16件が全件PASS。`CS03_LIVE_E2E=PASS`、`CS03_LIVE_LIST_EXIT_CODE=0`。これは開発PCから隔離Neon AuthとDBを利用した試験であり、公開エンドポイント経由・端末間同期の実証ではない。

今回の試験で使い捨てAuthユーザー2件と履歴3件が隔離環境に作成され、自動削除は未実施。秘密情報は記録しない。公開アプリ・Neon Functions・GitHub Actionsは変更なし。

**次工程**: アカウント別の学習画面履歴復元と明示的同期の設計/実装、公開APIの安全な接続・濫用対策・無課金運用確認、2端末E2E。端末内 `db-study-progress-v1` を暗黙にアカウントへ移行しない。公開は未承認。
