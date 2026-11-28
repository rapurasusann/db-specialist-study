# CS-03 現行ランタイム設定マトリクス（2026-11-28）

**目的：** Cloudflare Worker と Neon Function の実装が要求する設定名・用途・正規値・確認状態を一元管理する。値の登録やデプロイの承認書ではない。秘密値・DB接続文字列・認証トークンはこの文書に記載しない。

## 1. Cloudflare Worker

対象アカウント：Certification-Study  
Worker：`cs03-browser-isolated-candidate-not-approved`  
実際の設定監査：2026-11-28、Script Settings GET、PASS

| 種別 | 名前 | 設定値・条件 | 実設定確認 |
|---|---|---|---|
| Plain variable | `CS03_BROWSER_JWT_MODE` | `isolated-review-only`（この値でも実通信を有効化するため、別途承認前は登録禁止） | 未登録 |
| Plain variable | `CS03_JWKS_URL` | `https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth/.well-known/jwks.json` | 未登録 |
| Plain variable | `CS03_JWT_ISSUER` | `https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech` | 未登録 |
| Plain variable | `CS03_JWT_AUDIENCE` | `https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech` | 未登録 |
| Plain variable | `CS03_NEON_FUNCTION_URL` | `https://br-snowy-truth-a162pmdt-cs03progress.compute.c-1.ap-southeast-1.aws.neon.tech/`（Neon管理APIのinvocation_urlから取得） | 未登録 |
| Secret | `CS03_GATEWAY_SECRET` | 暗号学的乱数32 UTF-8 bytes以上。Neon Function側と同じ値。チャット・GitHub・ログに保存禁止 | Secret binding 0件 |
| Durable Object binding | `CS03_QUOTA` | class `Cs03QuotaNotDeployed`、SQLite migration済 | 登録済み |

worker entrypoint `server/cs03-browser-jwt-entrypoint.mjs` は `CS03_BROWSER_JWT_MODE !== 'isolated-review-only'` またはCloudflare request context欠落で503。candidateは上記5変数とDO binding、32 bytes以上の共有秘密を要求する。設定値を登録するとゲートウェイの実リクエスト経路が動き得るため、modeを含む全登録は独立した承認対象。

## 2. Neon Function

Project：`quiet-mouse-39990305`  
Branch：`br-snowy-truth-a162pmdt`（`cs03-auth-isolation-20261117`、非default）  
Database：`cs03_auth_sandbox`  
Role：`cs03_progress_api`  
Function：`cs03progress`  
Invocation URL：`https://br-snowy-truth-a162pmdt-cs03progress.compute.c-1.ap-southeast-1.aws.neon.tech/`

| 種別 | 名前 | 設定値・条件 | 実設定確認 |
|---|---|---|---|
| Secret | `CS03_ORIGIN_SECRET` | Workerの`CS03_GATEWAY_SECRET`と同じ暗号学的乱数値、32 UTF-8 bytes以上 | 未確認 |
| Plain variable | `CS03_ISOLATED_BRANCH_ID` | `br-snowy-truth-a162pmdt` | 未確認 |
| Secret | `CS03_TEST_DATABASE_URL` | 対象hostが `ep-dawn-dew-a11prveg...`、DB `cs03_auth_sandbox`、user `cs03_progress_api`、`sslmode=verify-full`。値は記録禁止 | 未確認 |
| Neon-injected | `NEON_BRANCH_ID` | NeonがFunction実行時にブランチIDを注入。コードは存在時に固定IDと一致するか照合 | provider仕様上自動注入、実環境値は未取得 |
| Neon-injected | `DATABASE_URL` | Postgres有効branchではNeonが自動注入するが、CS-03 runtimeでは使用禁止。専用`CS03_TEST_DATABASE_URL`を要求 | 自動注入仕様のみ確認 |
| Neon-injected | `NEON_AUTH_JWKS_URL` | Neon Auth有効時に注入される。現行runtimeは検証済み固定JWKS URLを直接使用 | 自動注入仕様のみ確認 |

Neon Functionsの現在の管理API応答で確認できるのはdeployment ID/status/runtime/memory/created_atまで。環境変数の一覧・値は応答に含まれない。したがって上の3 user-defined variablesは「存在しない」と断定せず「未確認」とする。

## 3. 実環境で確認できたこと

- Cloudflare Worker Script Settings GET：PASS。Binding count 1、`CS03_QUOTA:durable_object_namespace`のみ。6つの想定設定名は未登録、Secret binding count 0。
- Workerのworkers.devとpreview URLsは無効、custom domainsは0件（前回provider audit）。
- Neon Function `cs03progress` deployment 1 completed、runtime `nodejs24`。
- Function invocation URLをNeon管理APIから取得済み。
- JWT実署名・issuer・audience検証はローカルでPASS。
- Neon Auth Trusted OriginはGitHub Pagesのoriginを登録済み。
- DB role / RLSの読み取り監査はPASS。

## 4. 未完了・禁止事項

1. Neon Function user-defined environmentの現状インベントリは未取得。値を取得する`neon env pull`やsecret値の出力は禁止。画面等で名前だけ・値をマスクした確認方法を別途検討する。
2. 共有秘密は未確認。値の生成・登録は、両サービスの保存場所と安全な投入手順、反映・失効・ロールバックを確認してから別途承認を得る。
3. `CS03_TEST_DATABASE_URL`の作成・登録・接続試験は未完了。既定の`DATABASE_URL`を代用しない。
4. Workerの設定登録（特に`CS03_BROWSER_JWT_MODE`）はゲートウェイを実行可能にする変更。現在はすべて未登録のまま維持し、承認なく書き込まない。
5. workers.dev/Preview/custom routeを有効化しない。認証済みGET/PUTとブラウザ間同期は未実施。
6. Neon Functionsの環境変数変更は新しいdeployment snapshotになる。Functionの現行artifact/sourceとの一致、デプロイ方法、rollbackを確認し、別途承認を受ける。
7. DO bindingが存在することは、live quotaのatomicity・上限・Free tier cost safetyの実証ではない。

**現状判定：** Workerは設定不足でfail-closed。Neon Functionの実行環境変数は未確認。認証済みデータ同期はNO-GO。一般公開もNO-GO。値の登録・デプロイ・route変更をしていない。

## 5. 公式仕様参照

- Neon Functions environment variables：https://neon.com/docs/compute/functions/environment-variables
- Neon Functions deploy/manage：https://neon.com/docs/compute/functions/deploy
- Neon Functions get started（invocation URL形式）：https://neon.com/docs/compute/functions/get-started
