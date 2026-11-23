# CS-03 実クラウド直前：Worker / Neon Functions実行仕様・無料枠最終照合（2026-11-23）

**判定：NO-GO（実クラウド配置・秘密書込み・公開切替禁止）**。実行環境の外形仕様と既存ソースの読み取り結果。テスト済みと未確認を混同しない。

## 1. Neon Functions実行方式と現行コード

Neon公式（2026年公開情報）：Functionsは**Node.js 24のHTTP handler**として対象branchに配置され、**default exportがfetch(request)を提供するモジュール**が動作する。配置宣言には通常`neon.ts`を利用し、Neonのランタイムは**`DATABASE_URL`を注入**する。参考：https://neon.com/blog/neon-functions-backend-logic-next-to-your-data / https://neon.com/blog/neon-backend-is-ga

既存の`functions/cs03-progress.mjs`は`export default {fetch(request){return handleBrowserRequest(request);}}`を持ち、Node標準`node:crypto`を利用して秘密を比較する。**fetch入口の形式は一致**する。ただし`pg`などの依存解決／ビルドと本番ランタイムのパッケージ配置を確認したものではない。Neonに何も配置していない。

**構成上の重要差分**：Neonランタイムから自動提供される`DATABASE_URL`にそのまま頼る設計ではない。現在の`server/cs03-runtime.mjs`は`CS03_TEST_DATABASE_URL`、`CS03_ISOLATED_BRANCH_ID`、`CS03_ORIGIN_SECRET`を別途必要とし、`CS03_TEST_DATABASE_URL`のDB名`cs03_auth_sandbox`、利用者`cs03_progress_api`、ホストprefix`ep-dawn-dew-a11prveg`、リージョン、`sslmode=verify-full`をチェックする。これらがFunction環境のprivate envに実際に設定可能で、正しい**非default branch**へつながることを個別照合するまで実接続不可。Neon管理機能が注入するDB URLを黙って使う／prodやdefault branchを指す値で代替することは禁止。

## 2. Cloudflare Workerの現在の配置入口

- レビュー用`docs/cs03-worker-config-review-only.json.example`は、`main=./server/cs03-worker-candidate.mjs`を指すが、このモジュールには`default fetch`入口がない。**レビュー設定であり、そのまま配置不可**。
- `server/cs03-gateway-production-adapter.mjs`にはdefault fetch入口があり、`CS03_ISOLATED_GATEWAY_MODE='isolated-review-only'`および`request.cf`を要求。どちらかがない場合503を返す。これだけではCloudflare正規経路であることの実証にならない。
- Workerで必要なprivate secretは`CS03_GATEWAY_SECRET`、DO bindingは`CS03_QUOTA`、SQLite DO classは`Cs03QuotaNotDeployed`。その他の`CS03_JWKS_URL`、`CS03_JWT_ISSUER`、`CS03_JWT_AUDIENCE`、`CS03_NEON_FUNCTION_URL`は実メタデータ未確定。Neon Function側の`CS03_ORIGIN_SECRET`と秘密値一致は未確認。
- Cloudflare公式Wrangler設定では`workers_dev:false`で`workers.dev`経由を公開しない。 `preview_urls:false`でプレビューURLも無効化できる。routeが存在しなければ**アクセス可能なHTTP経路を設けていない**ため、ローカルworkerdテストはできてもクラウド間HTTP通信をまだ受入できない。実クラウド試験用の**限定したアクセス方式・安全な到達経路・遮断方法は別途設計と承認が必要**。参考：https://developers.cloudflare.com/workers/wrangler/configuration/

## 3. Free枠とfail-closed

- Cloudflare専用Certification-Studyアカウント：2026-11-23の画面でWorkers Free Active、Durable Objects Free tier、支払方法なし、利用初期値0を確認。**将来の課金ゼロ保証ではない**。
- Workers Freeのaccount単位上限とDOのCPU/requests/duration/SQL関連の別上限がある。サービス全体の上限は独自の全体/IP/本人別の毎分制限とは異なる。公開URL・route方式が確定した後に、**迂回によって認証が外れるfail-openを禁止**する受入れを行う。
- Neon FunctionsはFreeプラン対象で、2026-11月のNeon公式説明では**100万invocations/月、10 active Capacity-Hours、400 waiting Capacity-Hours**が示されている。ただしプラン改定や実プロジェクトの条件・他の計測単位を照合するまでは保証値として使わない。参考：https://neon.com/blog/whats-new-with-the-neon-backend / https://neon.com/blog/neon-free-plan-1-gb-per-project
- 無料枠に到達した場合は機能を使えなくすることを許容し、**Function直アクセス、秘密の緩和、DBへの迂回保存は許容しない**。

## 4. 未完了の外部受入ゲート（対象とクローズ条件）

| ゲート | 現在 | 完了条件 |
|---|---|---|
| Workerの実配備用entrypoint | review-only、実配備設定なし | 隔離アカウント限定の実行構成と公開経路・停止条件を設計し、独立承認 |
| Cloudflare限定Ingress | workers_dev/preview/routesすべて無効 | 第三者アクセスを止めたまま隔離実通信を検証できる手段と停止操作を確定 |
| Neon Functionの実登録 | 対象隔離branchのFunction 0件 | 対象branch固有のFunction URL、機能実行、envと依存解決を実証 |
| Neon envとDBロール | 独立DB / 最小権限をソース上固定 | Functionに`CS03_TEST_DATABASE_URL`等が安全に注入されること、実接続先とRLSが隔離branchに一致 |
| 秘密の整合 | Worker/Functionの名前と契約のみ | 実secret storeと値一致、秘密なし／誤秘密／旧秘密拒否、事故時の失効を受入 |
| Quota fail-closed | workerdローカルPASS | Cloudflare実DO障害時503、制限時429、上流未到達、routeの迂回防止を実証 |
| 利用量・費用 | 両Freeプランの画面確認 | 専用アカウントとNeonの当日の上限・費用・停止策を承認前に再確認 |
| ブラウザ公開 | previewEnabled=false、CSPは外部API制限 | 実接続受入と別承認後、最小接続先だけを許可する |

## 5. 次の順序

1. **現時点で実施可能**：Neon Function用の隔離環境変数と依存・ビルド条件、Workerへの非公開試験Ingress案、クラウド障害時の停止手順を文書化・静的受入。欠けている実環境情報はOPENに保つ。
2. **実配置前**：実行可能な入口・依存・制限条件が揃い、手順と料金/停止/影響範囲を提示できた場合のみ、ユーザーに**実配置の個別承認**を求める。
3. **個別承認後のみ**：専用Cloudflareと隔離Neonの機能を作成し、最小限の隔離試験を行う。GitHub Actions、本番`main`、既存アプリのCloudflareアカウントは操作しない。
4. **さらに別承認後**：CS-03ブラウザ公開プレビュー・CSPと本番公開可否を判断。

**既存追加ローカル試験26/26 PASS**、既存の合格済み試験は関連実装変更時以外は再実行不要。ただしクラウドの実証とは無関係。現状は**NO-GO**。
