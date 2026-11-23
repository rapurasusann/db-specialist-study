# CS-03 Cloudflare隔離試験 — 初回配置可否の最終整理（2026-11-23）

## 結論
**Cloudflare Worker/DOの作成は現時点NO-GO**。前段で承認を得て実行したNeon隔離Functionの作成とは別操作であり、Cloudflareの作成・ルート公開・Access Policy書込み・secret登録・課金設定変更の承認はまだ得ていない。Cloudflareの初期画面確認・Neonの未認証拒否試験を再実施して時間を使わない。

## 確定済み
- Neon専用project `quiet-mouse-39990305` / 非default branch `br-snowy-truth-a162pmdt` / Function `cs03progress`：deployment ID 1 completed, Node24。共有secretを追加登録しない状態で実HTTPS GET 3件（Originなし403、秘密なしroot401、秘密なし/progress401）PASS。これは特定3条件の拒否試験であり正常通信・JWT・DB操作の実証ではない。
- Cloudflare専用Certification-Studyアカウント：ユーザー提供画面でWorkers Free有効、Zero Trust Free有効、支払方法なし、Worker/DO 0件、当時の利用量0。**この時点での状態確認はC01の初期点検として完了**。将来の請求ゼロや利用量0を保証するものではない。
- 公式（2026-11-23閲覧）：https://developers.cloudflare.com/durable-objects/platform/pricing/ によればWorkers FreeはSQLite-backed DOが利用可能。https://developers.cloudflare.com/workers/configuration/cloudflare-access/ はWorkerのproduction+previewを一括で保護するAccessを説明。https://developers.cloudflare.com/workers/platform/limits/ によればFreeの1日10万リクエスト上限、route設定のFail openはWorker迂回・Fail closedは1027返却。従って制限超過時に認証を迂回できない構成が必要。

## 現行コード照合
| ソース | 実装済みの事実 | 実配置に残る危険・対処 |
|---|---|---|
| `server/cs03-worker-candidate.mjs` | JWT検証器・共有Quota/DO transport・Neon上流接続を構成する候補 | 明示的にreview/test-onlyで、単独Workerのdefault exportがない。Origin, IP及び上流信頼境界の実環境検証が未了 |
| `server/cs03-gateway-production-adapter.mjs` | Worker default.fetch・SQLite DO exportがあり、初期設定不備は503 | `CS03_ISOLATED_GATEWAY_MODE=isolated-review-only`と`request.cf`だけで実環境Ingressが保護済みと判定してはならない。このフラグはテスト用で認証境界ではない |
| `server/cs03-trusted-edge-gateway.mjs` | JWT確認・リクエスト検査・共有Quotaの試験経路・上流にsecret付与 | **ファイル冒頭にNOT SAFE TO DEPLOY**。プロセス内上限は複数インスタンスの強制上限ではない。DOの全体Quotaの動作、上流未呼出の確証、障害時503、HTTP細部の実環境試験が要る |
| `server/cs03-cloudflare-do-handler.mjs` / `server/cs03-cloudflare-do-transport.mjs` | SQLite DOのquotaを呼ぶ試験用部品あり | 共有DOの原子的処理とbinding/migrationの実配置確認がない |
| `docs/cs03-worker-config-review-only.json.example` | `workers_dev:false`, `preview_urls:false`, routeなし、SQLite DO migration | `main`がdefault export無しの候補を指しているため**そのまま配置できない**。公開HTTP入口が無いので実ブラウザ試験もまだ不可。設定を勝手に公開対応に変更しない |
| `scripts/cs03-predeploy-guard.mjs` | 既定NO-GOの確認ゲート | **TRUSTED_GATEWAY_NOT_IMPLEMENTED / GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING / ISOLATED_DEPLOYMENT_APPROVAL_MISSING**が残る。これを無効化しない |

## 過度な確認を増やさずに残作業を進める順序
1. **ローカルのみで統合実装**：試験コードを基に、本当にWorker全体で分散Quotaが必須となり、DO障害で上流Neonを呼ばない経路を完成。デプロイ用entrypointとSQLite migrationを矛盾なく一致させる。`request.cf`自体や単なるmode変数を認証済みの証拠にしない。
2. **最小の受入を一括実行**：JWTの正常/不正、Quota 429/DO停止503と上流未送信、Origin/CORS、上限・経路不能時fail-closed、秘密の非露出をローカルで検証。個別の重複試験を増やさない。
3. **Cloudflare隔離初回作成の別承認**：Worker 1件+SQLite DO class 1件、Certification-Studyのみ、Workers Free/Zero Trust Free継続、支払い追加なし、他サービス影響なし。候補作成は無公開route/preview disabledとし、**この段階ではHTTPS試験口がなくAccessによる未認証拒否は確認できない**。
4. **限定Access + 試験用入口は別承認**：対象Workerのproduction/preview両方、試験者1名のみ許可。Accessの実設定と未認証拒否・route/alternate URL迂回不可を検証後、許可した通信だけを上流Neonに通す。Workerの配置と同時に知らないままworkers.dev等の公開口を有効にしない。
5. **Neon secretの追加と実同期はさらに別承認**：実secretはChatGPT/GitHub/コマンド履歴に出さず開発PCの安全な方法で投入。Neonは必要条件を満たすまでは401拒否を維持。正常なJWTでPC→別端末の保存・読取を実証したら本番公開は別審査。

## 停止、費用、切戻し
- 初回WorkerはHTTP入口なし、previewなし、外部経路なし、Neon secret無しで作成する案。アプリ未公開でもアカウント上で計測・課金条件を監視する。**Workers Free/DO Freeの超過時の請求ゼロを保証しない**。
- 以降の試験で予想外2xx、認証回避、Quota失効時の上流送信、他のCloudflare/Neon projectへのアクセス、追加請求が疑われれば停止。Accessを閉じるだけではNeon直URLを消せない。Neon側secretの失効/Function削除など個別対応を行う。
- リソース削除、secret変更、Accessポリシー書込み、URL公開、CSP変更、GitHub Actions、main統合、有料化は新規の明示承認がない限り実施しない。

**この文書自体は実クラウドの書込みや配置を意味しない。** 次はソース側の統合・短期の受入準備を完了させ、初回Cloudflareリソース作成の範囲をひとまとめにして承認依頼する。

## 実装進捗：Worker入口の一致修正（2026-11-23）

- `docs/cs03-worker-config-review-only.json.example` の `main` がdefault exportを持たない `cs03-worker-candidate.mjs` を指す誤りを修正し、実際の fail-closed wrapper `server/cs03-gateway-production-adapter.mjs` を指定。
- `scripts/cs03-worker-review-config.mjs` にentrypointとreview-only nameの検査を追加し、候補モジュールを誤ってpublic entrypointに指定した構成を拒否する。
- `tests/cs03-worker-review-config.test.mjs` に上記の負試験1件を追加。**開発PCで未実行**なのでPASSとは報告しない。
- review-only設定は `workers_dev:false`・`preview_urls:false`・routesなし、Secretsなし、`CS03_QUOTA` SQLite migration を維持。**この設定は意図的に公開路がなく、配置許可や完成を意味しない**。
- 実際のWorkerアダプターはまだ `CS03_ISOLATED_GATEWAY_MODE` と`request.cf`で503 fail-closedする試験用で、**Cloudflare Accessの実検証、Neon JWT設定・secret、DOの実運用確認は未了**。残る本番安全性の問題を隠してNO-GOを解除しない。

**次**：開発PCで `node --test tests/cs03-worker-review-config.test.mjs tests/cs03-worker-entrypoint.test.mjs tests/cs03-worker-candidate.test.mjs` を1回まとめて実行する。合格後もWorker/DO/Access配備の独立承認まではクラウド変更しない。

## 開発PCでのWorker統合テスト合格（2026-11-24受領）

ユーザーから開発PC実行の結果を受領。対象HEADは `2a315c59af39dfac0ea3cab2e9d73f7f5cbc0b93`、テストは以下を一括実行：
```
node --test tests/cs03-worker-review-config.test.mjs tests/cs03-worker-entrypoint.test.mjs tests/cs03-worker-candidate.test.mjs
```
**実行結果：14 tests / 14 pass / 0 fail、`CS03_WORKER_INTEGRATION_TEST_PASS`。** 機能別の内訳は、候補構成の環境変数欠落時503・不正JWT拒否・Origin拒否・DO異常停止・IPヘッダー不正・review-only Worker設定の公開経路禁止・default export入口の正当性・predeploy guardによる独立NO-GOなど。実CloudflareでのAccess・Durable Object・課金・認証/同期試験の合格を意味しない。

**今後の作業条件**：ユーザーは**次の19時（日本時間2026-11-24 19:00）まで、ローカルリポジトリがないPCからできる作業を進める**よう依頼。GitHubへのコード・ドキュメント更新、公式仕様/セキュリティ検討、必要に応じNeon読み取りのみが対象。開発PCに依存するコマンドの実行や同じテストの再提出は要求しない。**GitHub Actionsは勝手に使わない**。クラウドへのWorker/DO/Access/Neon秘密配備、Neon既存Function変更、本番公開、CSP、GitHub main、課金、支払方法、削除は引き続き別承認。次の開発PC復帰に備えて未実行テストと作業差分を一括報告する。

**現状：Neon隔離Functionの初回実配備とGET拒否 3/3 PASS。Worker候補コードのローカル結合 14/14 PASS。Cloudflare上のWorker/DO/Access Policy未作成。実同期未実施・一般公開NO-GO。**


## 2026-11-24 リポジトリ不在PCからの安全対策（追加開発）

**目的**：現時点で一般公開可能とは判断しないまま、実クラウドに接続する手前のWorker防御をGitHub側で強化する。

### 本チャットで追加・変更した内容（実行未確認）
1. `server/cs03-gateway-production-adapter.mjs`：`fetch(request, env, ctx)`の先頭で **Cloudflare Accessが認証した`ctx.access.aud`と実設定`CS03_ACCESS_AUD`の一致**を要求。不一致・未設定・`ctx.access`なしでは503かつGateway/DO/Neonを呼ばない。以前の`request.cf`とmode flagだけではクラウド側Access認証を証明できない問題を軽減。Cloudflare公式 https://developers.cloudflare.com/workers/configuration/cloudflare-access/ は`ctx.access`がAccessで認証した直接Worker呼出時のみ存在すると説明。**実Accessアプリの有効化・ポリシー確認を省略していいことにはならない**。Static Assetsの内部ルーター/Service Bindingの迂回ではctx.accessが伝播しないため、当該構成は本候補に使わない。
2. `tests/cs03-worker-entrypoint.test.mjs`：Access不在・誤aud・空audでGatewayを生成せず503、正しいテスト用audのみ呼出可をテストする1件追加。
3. `tests/cs03-worker-entrypoint-full-chain.test.mjs`：既存の仮想Accessコンテキストを統合テストの入出力に通すよう修正。未認証・aud不一致時のDO/Neon未呼出の負試験1件を追加。テスト用audをクラウド本番値に流用しない。
4. `docs/cs03-worker-entrypoint-contract-review-only.json`：`CS03_ACCESS_AUD`の**実Cloudflare Accessアプリ発行値が必要**と明記（現時点ではプレースホルダー）。
5. `server/cs03-cloudflare-do-handler.mjs`：内部DOのPOST bodyをstream読取し、`Content-Length`がない場合でも**1024 bytesを超えた時点で読み込み中止**、異常UTF-8やJSON破損は400で拒否。元の`await request.text()`による全量バッファを撤廃。
6. `tests/cs03-cloudflare-do-handler.test.mjs`：大きなストリーム/不正UTF-8を保存前に拒否する2件追加。
7. `package.json`：従来の`test:cs03`にAccess契約検査を追加し、`npm run test:cs03-worker-security`でAccess/Worker/DOの対象試験を一括実行できるようにした。

**重要**：ユーザー開発PCでの旧コミット`2a315c5`の14/14 PASSは維持。ただし上記のコード変更後は**未実行**で、14/14 PASSと混同しない。追加テストが通るまではCloudflare配置NO-GO。Cloudflare Workers/DO/Access、Neon既存Function、秘密、課金、公開は未変更。

### 継続作業スケジュール
ユーザーが依頼した2026-11-24 19:00 JSTまでの短期間について、**03:00、07:00、11:00、15:00、19:00（JST）の5回**の継続チェック・GitHub側の安全な修正タスクを設定。各回GitHubの最新版を再取得し、レビュー済みの範囲のみ変更。重複変更・GitHub Actions・本番/クラウドの書込みは禁止。これは常時実行ではなく**決めた時刻に作業を再開する方式**。

### 次の開発PC復帰時に1回だけ確認
`npm run test:cs03-worker-security`。コマンド実行前にGitHubのリモートHEADと開発PCの未コミット変更を確認する。実行ログを受領してPASS確認するまで「クラウド作成可」としない。Neonの実HTTP拒否3/3 PASSは再実施不要。
