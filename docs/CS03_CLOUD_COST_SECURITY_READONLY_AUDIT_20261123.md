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


## 5. Worker–Function契約の追加検査（未検証コード）

追加コード（feature branchのみ）：`scripts/cs03-isolated-contract-review.mjs` と `tests/cs03-isolated-contract-review.test.mjs`。実際のWorker/Function接続値、トークン、共有秘密は一切取得・記録しない。既存ソースを読み取り、**Origin / JWT issuer・audience / JWKS固定値 / DB隔離ブランチ / x-secretの受け渡し / 公開プレビューOFF** の差分を検出する。Worker環境変数名 `CS03_GATEWAY_SECRET` とNeon環境変数名 `CS03_ORIGIN_SECRET` を区別し、接続時に値が一致する必要があることを明文化した。

設定値の不一致、偽のFunction URL、秘密ヘッダーの欠落を拒否する**追加6件は未実行**。実Function URLはまだないため `NEON_FUNCTION_URL_UNAVAILABLE` を残す。URLの見た目が正しくても、隔離Neonブランチに属する証拠がなければ `NEON_FUNCTION_URL_OWNERSHIP_UNVERIFIED`。共有秘密の値一致、Cloudflareからの信頼できるIngress、独立した隔離デプロイ承認は**静的チェックで合格させない**。

この追加検査は**構成レビュー**であり、セキュリティ全体の証明や実接続の代替ではない。レビュー用ファイルの作成だけでデプロイ停止ガードを解除しない。実アカウントのCloudflare使用量の確認も別工程のまま。判定は **NO-GO**。

## 6. 接続契約チェックの開発PC試験結果（6/6 PASS）

操作者の開発PCで commit `87aca7b7e949839f9813f2cfafa21875985ea0d7` をチェックアウトし、`node --check scripts/cs03-isolated-contract-review.mjs` と `node --test tests/cs03-isolated-contract-review.test.mjs` を実行。**6 tests / 6 pass / 0 fail**、`CS03_CONTRACT_TEST_PASS` を確認した。

対象は固定Origin・隔離環境のissuer/audience/JWKS、Function URLの妥当性と所有先未検証の継続、秘密ヘッダー欠落と秘密バインディング名不一致の検出、メタデータ不足時のfail-closed。**設定メタデータのローカルチェックであり、実際の資格情報の一致、Neon Functionsの配置、Cloudflareの実ルート、クラウド費用保証を実証したものではない。**

次工程の仕分け：
- **ローカルで継続可**：安全な停止/切戻し手順とクラウドに依存しない否定系の棚卸し、Worker/Neon間の実通信に必要な設定手順の明文化。
- **読み取り確認待ち**：Cloudflareの現時点のWorkers Free / Durable Objects使用量・課金/超過時の設定、Neon側のFunctionホスト/URLと秘密値設定の実在。
- **個別承認まで禁止**：隔離Neon Function / Worker / DOの新規配置、公開ルート作成、秘密書込み、本番CSP変更、実通信テストでの課金リスクを伴う操作。

**公開判定NO-GOを継続**し、既存のデプロイ停止ガードと公開プレビューOFFを維持する。

## 7. 運営者確定方針：資格勉強アプリ専用Cloudflareアカウント

**2026-11-23 運営者指示：他のアプリ／Cloudflareアカウントとリソース・使用量・契約を分離し、他への影響を避ける。** CS-03のCloudflare Worker / Durable Object / APIトークン / 秘密設定 / 監視 / 課金・無料枠を**資格勉強アプリ専用の別Cloudflareアカウント**にのみ配置する。現在画面に表示された既存の Cloudflare アカウントへは新規配置しない。既存アカウントの Workers、DO、DNS、Routes、Limits、課金、プラン設定を変更しない。

- 現在の同一ログインでのアカウント追加と独立したFree account作成はCloudflare公式でサポートされる。ユーザーによる専用アカウント作成後、アカウントIDとFree契約の証拠を読み取り確認してから、そのIDだけを明示的に許可する。**作成・設定・配備の操作はまだ行っていない**。
- Workers Freeのリクエスト枠はaccount単位。Cloudflare公式によればアカウントごとの請求プロファイルも独立。資格勉強アプリ専用アカウント内に他サービスを混在させない。ただしCloudflare基盤の障害まで隔離できるとは主張しない。
- Neonは既存の `Certification-Study` 組織と `certification-study` プロジェクトを維持。分離が未確認の接続先や、他プロジェクトのリソースは使わない。
- **新規デプロイの追加停止条件**：専用Cloudflareアカウント未作成／専用Account ID未確認／Freeプラン未確認／アカウント横断リソース共有の疑い → **NO-GO**。専用アカウント作成だけでCloudflare FunctionsやWorkerの配置許可とはみなさない。

Cloudflare公式資料：
- https://developers.cloudflare.com/fundamentals/account/create-account/
- https://developers.cloudflare.com/fundamentals/concepts/accounts-and-zones/
- https://developers.cloudflare.com/workers/platform/limits/

## 8. 専用CloudflareアカウントのWorkers Free請求画面確認（2026-11-23）

運営者が提示したCertification-Study専用Cloudflareアカウントの **Billing → Subscriptions（Subscribed）** の画面から、**Workers Free / Active**、**Workers PaidはUpgradeの案内のみ**、**Payment method: No payment method on file** を視認した。直前の同じアカウントのWorkers & Pages画面には本日リクエスト0/100,000、観測可能性イベント0/20,000、アプリケーション0件が表示されていた。これらは**2026-11-23の画面観測**であり、今後の残枠を保証しない。

**完了**：資格勉強アプリ専用Cloudflareアカウントの存在と、Workers Freeの有効なサブスクリプション、支払い方法の未登録を確認。
**未確認**：Durable Objectsの利用実績・無料枠、Billable usage、Spend limits、他の有料サービスが有効でないこと、将来の各機能の課金条件、Worker routeのfail-closed。これらをWorkers Freeの画面だけで合格としない。設定変更、新規Worker作成、課金操作、本番配備はしていない。公開判定は **NO-GO**。

## 9. 専用CloudflareアカウントのDurable Objects未使用確認（2026-11-23）

運営者の提示した専用アカウント「Certification-Study」の **Compute → Durable Objects** ダッシュボード（画面上の日付 November 23）で **No Durable Objects found** を確認。Usage欄は **Duration 0 GB-sec、Requests 0、Total SQL storage 0 B、Total KV storage 0 B、SQL rows read 0、SQL rows written 0、KV storage operations 0**。この時点の画面観測であり、将来の利用量や料金発生がない保証ではない。

**確認済み：** 現在の専用アカウントにDurable Objectsが存在せず、各表示使用量はゼロ。前工程でWorkers Free Active、Payment methodなしを確認済み。
**残る条件：** Billable usage/Spend limitsの設定詳細、Durable Objectsを導入した際のFree対象条件、Workers route fail-closed、隔離Neon Functionsへの実接続、ユーザーの個別配置承認。別アカウント／既存サービスには触れない。**NO-GO維持**。

## 10. 専用CloudflareアカウントのSpend limits画面確認（2026-11-23）

運営者が提示した **Certification-Study → Billing → Spend limits (Beta)** 画面では、Product family の **Workers / Free tier** と **Durable Objects / Free tier** を確認した。History には `No activity yet` と表示され、課金制限ポリシーの変更／上限到達の記録は表示されなかった。

**確認済み**：両サービスとも画面上のステータスはFree tier。前画面ではWorkers Free Active、支払い方法登録なし、Workers Requests 0/100,000、Durable Objects各利用量0を確認。
**確認できない**：この画面は明示的な `$0` の支出上限設定・全サービスの請求額ゼロ・将来の非課金を保証する証拠ではない。現行Free枠に収まるよう専用アカウントのWorker/DOだけを利用し、未承認の有料機能や従量課金を有効化しない。WorkersのFree上限超過時fail-closedとNeon Functions実配置前の隔離条件は別途受入。公開／実配置判定 **NO-GO**。

## 11. 専用Cloudflareアカウントの配置前ID固定ガード

操作者の2026-11-23 Workers & Pages画面で確認した**資格勉強アプリ専用**のCloudflare Account IDを、`scripts/cs03-cloudflare-account-guard.mjs` に非機密の識別子として固定した。`CLOUDFLARE_ACCOUNT_ID`／`CF_ACCOUNT_ID` の両方を検査し、未設定・不一致・競合の場合は `CS03_DEDICATED_CLOUDFLARE_ACCOUNT_*` の停止要因を返す。レビュー用のWrangler configでは別アカウントID・公開routes・zoneの指定も拒否する。既存の `scripts/cs03-predeploy-guard.mjs` にこの検査を組み込んだ。

**テスト追加・開発PCでの実行待ち**：`tests/cs03-cloudflare-account-guard.test.mjs` の5件。合格した場合でも独立の`ISOLATED_DEPLOYMENT_APPROVAL_MISSING`、`GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING` を維持し、デプロイを許可しない。**注意**：このガードは本リポジトリの検証経路のみを対象とし、直接`wrangler deploy`や別リポジトリの操作、ブラウザでの手動配置を技術的に禁止できるわけではない。将来の配置時は明示承認・対象アカウント確認・権限最小化が別途必要。

作業中にCloudflare/Neon APIへの書込み、本番設定変更、有料契約、GitHub Actionsは実施していない。公開判定は引き続き**NO-GO**。
