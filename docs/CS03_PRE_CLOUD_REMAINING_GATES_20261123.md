# CS-03 クラウド接続前の残課題・停止条件（2026-11-23）
判定：**NO-GO**。この資料は読み取りレビュー／今後の検証計画であり、実配置・秘密登録・課金変更の承認ではない。

## 現在合格済み（再試験不要、関係するコードや条件が変わった場合を除く）
- 専用Cloudflareアカウントの存在、Workers Free Active、Durable Objects Free tier、支払い方法なし、初期使用量0：2026-11-23の画面観測。
- 専用Account IDに固定した静的ガード：5/5 PASS。検証経路以外のCLIや手動操作を防ぐ機構ではない。
- ローカルworkerd：署名済みJWT、読み書き、SQLite-backed DO、429、無効JWT、Origin不一致の既存試験PASS。
- ローカルworkerd追加否定系：11/11 PASS（認証なし、issuer/audience/有効期限、Originなし、メソッド、path、content-type、超過body、OPTIONS）。
- 既存ブラウザ／ローカル試験結果は個別の証拠文書を参照。合格した試験を総合的な「本番セキュリティ合格」としない。

## A. ローカルで判断できることと残る作業
| ID | 項目 | 現状 | クローズ条件 |
|---|---|---|---|
| A1 | Worker→Neon秘密ヘッダー | Worker: `CS03_GATEWAY_SECRET`、Function: `CS03_ORIGIN_SECRET`、両者ともサーバー専用 | 同一32-byte以上の値を別々のsecret storeに登録する手順、照合・更新・失効の安全な段取りを文書化。実値はGitHub/ブラウザ/ログに書かない |
| A2 | JWTのissuer/audience/JWKS | 固定照合用ローカル契約試験6/6 PASS | 隔離Neon Authの実メタデータとの読み取り照合。JWTの署名検証を省略しない |
| A3 | Function URL所有確認 | 隔離ブランチのFunctions 0件 | 実Function配備後、URLが隔離branch固有のFunctionに属する証拠を取得 |
| A4 | 認証ゲートウェイの実体 | `server/cs03-worker-candidate.mjs` はdefault exportを持たず、adapterも未承認用フラグで停止 | 安全な配備用entrypoint・必要binding・一時停止スイッチ・ログ匿名化を別レビュー。現時点で実配備用設定を作らない |
| A5 | ローカル試験ハーネスと本番候補の差 | `local/cs03-auth-do-workerd.mjs` はテスト鍵・模擬Neon上流・固定テストIP | workerd合格を実Worker・実Neonの合格と取り違えない。未試験の接続部分を抽出する |
| A6 | 承認ガード | `scripts/cs03-predeploy-guard.mjs` はGateway、rate-limit acceptance、isolated approvalを未完了として拒否 | 各独立受入および運営者の明示的個別承認なしにNO-GOを解除しない |

## B. Cloudflare/Neonに実配置しないと判定不能なこと（現時点は待機）
| ID | 確認対象 | 必要な受入証拠 |
|---|---|---|
| B1 | 専用Cloudflareアカウントでの実配置 | 対象Account ID、Workers Free、SQLite DO、別アカウント無変更、APIトークンの権限最小化 |
| B2 | Free枠超過時の実経路の扱い | 認証を迂回するfail-openを禁止する。zone route利用時は明示的fail-closed設定を検証。現在はroutesなし、workers_devもfalseのため経路自体未確定 |
| B3 | DO共有上限と依存障害 | 同時多端末からの過剰要求がNeonに流れず429、DO障害時503、更新が成功扱いにならない証拠 |
| B4 | Neon Function直接呼出拒否 | `x-secret` 無し／不一致なら拒否し、ブラウザに秘密を持たせない。JWTとOriginの独立検証 |
| B5 | DB接続先の隔離 | `cs03_auth_sandbox` と `cs03_progress_api`、非default branchだけに接続。別DB/本番への書込み0 |
| B6 | 日次／月次の無料枠と利用監視 | Workersリクエスト、DO requests/duration/SQL行/保存量、Neon compute/storageの実績を確認。上限到達時は可用性低下を許容しデータ漏出／迂回を許容しない |
| B7 | ブラウザ公開設定 | 確定したAPI URLに対する最小CSP `connect-src`、CORS、プレビュー公開の個別承認。現行はOFF |

## C. 無料枠の解釈・今後の運用
- Cloudflare公式のWorkers Free：100,000 requests/day/account、UTC 00:00に更新。プロジェクト独自の毎分レート制限は**プラットフォームの無料枠停止保証ではない**。
- Cloudflare公式のzone routeにおけるFree上限時：fail openはWorkerの処理を迂回、fail closedはCloudflare 1027応答。現在のレビュー設定は**公開routeなし**。利用する最終公開方式を決めてから、該当方式の拒否を確認する。routeの設定を現在合格とみなさない。
- Durable Objects Free：SQLite backendのみ。無料枠上限を超えた操作は失敗するため、障害時に503/429など安全なエラーとして扱い、必要に応じて停止する。
- Spend limits画面の両サービスFree tierや支払方法なしの画面表示は「今後も絶対0円」の契約上の保証ではない。**有料アップグレード・有料オプション・支払方法登録を禁止**し、公式プラン条件と対象アカウントの変化を配置直前に再確認する。

公式参照：
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/spend-management/
- https://developers.cloudflare.com/workers/observability/errors/

## D. 実作業の順序（現時点はD1まで）
1. **D1: 読み取りのみで作業** — A1/A2/A4/A5の構成・秘密登録手順・公開方式と停止手順を文書化。未承認の秘密、配置コマンドはまだ作らない。
2. **D2: 独立承認が必要** — ユーザーに接続先・料金・使用量・公開経路と停止/切戻しを提示し、隔離環境への実配置を明示的に承認してもらう。
3. **D3: 承認後のみ** — 専用アカウントへ最小構成を作成しB1〜B6実測。Neon直アクセス拒否、失敗時保存なし、公開状態を先に点検。
4. **D4: 別途承認** — ブラウザの実接続を有効化し、最終的な規約・プライバシー・公開判断を行う。

**現時点で一切実行しない**：`wrangler deploy`、Cloudflare/Neon Functionsの作成・削除・secret書込み、route/DNS/CSPの変更、課金変更、GitHub Actions、本番 `main` 更新。

## E. A1 共有秘密の手順書確定（2026-11-23）

`docs/CS03_SECRET_LIFECYCLE_PLAN_20261123.md` に、Worker側 `CS03_GATEWAY_SECRET`／Neon側 `CS03_ORIGIN_SECRET` と `x-secret` の対応、32 UTF-8 bytes以上の同一秘密の安全な生成・保管・登録、実値を出さない照合、緊急停止、更新時の切替手順を記載した。**現行Neon Functionは単一秘密のみ照合するため、切替時は同期処理を停止して新旧が混在する時間の失敗を安全に扱う**。クラウド側のsecret管理の実在、登録、旧秘密失効、サービス間の値一致は引き続き未検証。**A1は文書作成のみ完了、実受入OPEN**。秘密値生成・クラウド書込み・公開変更・課金変更は未実施。**NO-GO継続**。
