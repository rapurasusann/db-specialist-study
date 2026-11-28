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

Neon Functionsの現在の管理API応答で確認できるのはdeployment ID/status/runtime/memory/created_atまで。既存cs03progressの応答には環境変数の一覧・値が含まれない。検証専用関数ではキー一覧が返ることを第10節で確認した。したがって上の3 user-defined variablesは「存在しない」と断定せず「未確認」とする。

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


## 6. 読み取り・秘密登録の安全手順（2026-11-28追記）
### Neon Function envインベントリ
Neon公式の現行API/CLI資料を照合した。`GET /projects/{project_id}/branches/{branch_id}/functions/{slug}`（MCP `get_function` 相当）が返すFunction情報はURLとdeployment status/runtime/memory/created_at等で、環境変数一覧を含まない。MCP `get_function`でも同じ。公式CLI `neon functions deploy`の応答はenvironment key一覧を返す場合があるが、これはデプロイ操作後の応答であり、既存deploymentを調べる読み取り専用手段ではない。`neon env pull`はNeon-managed env valuesをローカルファイルへ出力するため今回禁止。`neon.ts` config planも、現状のFunction deploymentのenv inventoryを返す根拠はない。

**現時点で安全な確認方法：** Neon Consoleで該当BranchのFunctions > `cs03progress` > 現行DeploymentのEnvironment/Variables表示を開き、値を開示せず、キー名だけを確認する。画面に値が表示される場合、共有前に必ずマスクする。UIに既存キー一覧がなければ、ここは未確認のまま止める（API deployによる「調査目的だけの更新」は行わない）。対象Console URL：
`https://console.neon.tech/app/projects/quiet-mouse-39990305/branches/br-snowy-truth-a162pmdt`

### Cloudflare secret metadata
Worker Script Settings GETはplain vars/ordinary bindingsの名前と種類を確認できる。Cloudflare公式Secret APIには指定済みsecret bindingを1件取得するGETがあり、応答例はname/typeのみでsecret valueを省略する。Read権限で確認できる。secret-list endpointは値フィールドを含むmodelを返し得るため、使う場合は値を必ず破棄して名前・typeだけを表示するクライアント処理が必要。現状のScript Settings auditでSecret binding count=0だったので追加API照会は不要。

### 共有秘密の登録方針（今後の別承認後）
- `CS03_GATEWAY_SECRET`と`CS03_ORIGIN_SECRET`は同一の暗号学的乱数（少なくとも32 UTF-8 bytes）を使用する。JWTとは別物。人間が考えた文字列やNeon DB passwordを流用しない。
- 値は開発PCで一度だけ生成し、チャット・Git・ログ・コマンドライン引数に出さない。ローカル端末で保護された一時保管を使い、Cloudflare Worker SecretとNeon Function deployment environmentへ直接登録し、投入後に一時保管を消去する。値そのものをスクリーンショット・PowerShell履歴に出さない。
- CloudflareはSecret bindingとして登録し、plain variableにしない。同名のplain variableが存在したら先に止まり、上書きしない。Cloudflare公式仕様ではSecretとVariableに同じbinding名は共存できず、変数更新が既存Secretを置換する場合もある。
- NeonはFunctionデプロイ単位のenvironment snapshotとして保存される。現行APIでは既存FunctionにZIPを省略したenvironment/runtime-only deploymentが可能だが、実行はFunction deploymentを更新する書き込み操作。既存envを保全する必要があるため、既存キーを一覧できない間は部分JSONを推測して送らない。全キー保持を確認できるまで更新禁止。
- 両側の登録後、secret値を読み戻さず、presence/type/required length booleanを実行環境内で確認する検査コードを作る。秘密値一致確認は各サービス内で比較用のHMAC指紋を計算し、片側の指紋を安全な一時経路で比較する方式を別途設計する。plain hashのログ出力は禁止。
- 一方だけ更新された、Function deployが失敗または結果不明、反映に時間差がある場合はWorker mode未設定のまま止める。両方の存在・一致・rollback手順が確定するまで`CS03_BROWSER_JWT_MODE`を登録しない。
- Admin権限を長期間保持しない。Cloudflareのsecret writeとbinding variable更新に必要な最小権限をAPI仕様で再確認し、短期tokenを作成し作業直後に失効する。

**現状：** Neon env key inventory未確認、Cloudflare secret 0件、共有secret未生成・未登録。環境設定変更・Function redeploy・Worker updateはいずれも未承認かつ未実施。NO-GO維持。


## 7. Neon Console Functions画面の確認（2026-11-28 JST）
操作者提供の画面では、Functions一覧に `cs03progress` のCompleted状態、Last deployed、Invocation URL、Triggers、Custom domains、View logs、Deleteが表示されている。環境変数名の表示・参照パネルは画面上に見当たらない。したがって、この画面からは既存Deploymentのuser-defined env key inventoryを確認できなかった。View logsはログ画面であり環境変数一覧ではないため、調査目的にクリックしない。DeleteやTriggers/Custom domainsのAddにも触れない。

Neon公式Functions環境変数ドキュメントでは、user-defined variablesはdeployment snapshotとして保存され、値を変更するには再デプロイが必要。`neon functions deploy --env KEY=VALUE` またはDeploy APIで設定する。Deploy APIのconfig-only updateは環境を変更する書き込み操作であり、一覧取得のために実行しない。`neon env pull`は値を`.env`に書くため使用しない。現状の安全な判断は既存の環境変数名一覧を未確認のまま保持し、設定変更なしで停止すること。


## 8. Neon env inventory method re-check (2026-11-28)
Current Neon docs (updated 2026-10-23) explicitly state that user-defined env variables are deployment snapshots, and a later `neon functions deploy --env KEY=VALUE` merges into the existing set: unspecified keys carry over; `KEY=` deletes a key. The Function detail GET/list output still contains only deployment metadata and no env names. Therefore the previous concern that every config-only update necessarily requires reconstructing every existing key was too strong for the CLI `--env` path: a targeted addition can preserve unspecified keys. However, it still creates a new Function deployment snapshot and changes runtime configuration, so it is NOT a read-only inspection and is not authorized merely to discover names.

The current Functions list screen shared by operator only shows Function name/status/deploy time/invocation URL/triggers/custom domains/logs/delete. It contains no visible env inventory. Next safe UI probe is clicking only the `cs03progress` function name/card to inspect a possible read-only details/deployment page. Do not click Delete, View logs, add trigger/domain, or any edit/deploy control. If details page has no env key list, conclude Neon exposes no safe read-only key-list path through the current available UI/API; keep env names unverified. A disposable probe variable and cleanup deployment is a possible later write-based audit only after explicit approval, because it creates deployment snapshots.

Official source: https://neon.com/docs/compute/functions/environment-variables (user-defined variables merged, unchanged keys carry over; empty assignment deletes). Do not use `neon env pull` because it writes Neon-managed values to `.env`/`.env.local`.


## 9. 初回配置記録による環境変数の照合（2026-11-28）
`CS03_NEON_FIRST_DEPLOY_HANDOFF_20261123.md` の第9・10節を確認。初回CLI配置は --env なし、Deployment ID 1、completed、nodejs24。未認証HTTP拒否3/3 PASS。操作者の現行Console画面も最終配置11月23日を表示し、Function名クリック不可、Monitoring画面には過去1時間のログ0件のみ。環境変数一覧の直接取得は未達だが、初回配置時の専用変数未登録を裏付ける記録が存在する。自動注入変数の有無や現在の全キー一覧を断定しない。追加画面操作や調査目的の再配置は不要。次は現行deployment IDの照合と、既存設定保持・秘密非露出・失敗時停止を満たす登録処理の設計。クラウド変更なし、公開NO-GO。

## 10. 隔離関数によるDeploy API実測（2026-11-28）
第6〜9節のAPI挙動に関する未確認事項を更新する。承認済みの一時関数 cs03envprobe のみを使用。実秘密・DB接続なし。

| Deployment | 操作 | 応答キー | 状態 |
|---|---|---|---|
| 1 | A=alpha, B=beta (PROBE_接頭辞) | A,B | completed |
| 2 | A=alpha2 | A,B | completed |
| 3 | C=gamma | A,B,C | completed |
| 4 | A=alpha, B=beta, C=空文字 | A,B | completed |

GETでも検証関数のdeployment 1のキー一覧を取得できた。部分更新・追加・空文字による削除のキー構成を確認。値の保持・復元および実行時挙動は未検証であり、完全なrollbackの証拠ではない。検証関数削除後の一覧はcs03progressのみ、current/activeともID 1 completedで変更なし。既存関数・DB・Workerへの書き込みなし。

登録処理 scripts/cs03-binding-stage-offline.mjs の preservation gate は維持する。次はダミー値の一致を実行時booleanのみで確認する検証。実秘密登録、mode有効化、公開はNO-GO。自動試験コードは追加済みだが実行証跡の再取得が必要。
