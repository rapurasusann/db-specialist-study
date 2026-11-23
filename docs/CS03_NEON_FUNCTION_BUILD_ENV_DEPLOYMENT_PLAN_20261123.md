# CS-03 Neon Functions ビルド・環境変数・隔離配備計画（読み取りのみ）
日付：2026-11-23。**実配置NO-GO／公開NO-GO**。本書の作成は課金・秘密登録・Neon/Cloudflare配置を許可しない。

## 1. 公式仕様で確認できたこと
- Neon Functionsはbranch単位の機能で、default exportに`fetch(request)`を提供するHTTP関数を扱う。Neon公式は`neon.ts`による関数source宣言と`neon deploy`によるbranch単位の配備を案内。例では`defineConfig({preview:{functions:{hello:{name:'...',source:'./functions/hello.ts'}}}})`。**現在のCS-03専用Functionの登録設定が既に存在するという意味ではない**。
- 最近のNeon Functionsテンプレート案内は、カスタムenv付きの配備で`neon deploy --env .env.local`を使用する例を示す。**このCLI引数が現行CS-03の全秘密を本番Functionsへ安全に保存できること、Cloudflare式のsecret storeに等しいことまでは未検証**。
- `neon link`／`neon checkout` はデフォルトでbranchのenvを`.env.local`等へ取得することがある。読取目的でも秘密がファイルへ保存されうるため、**今回実行しない**。明示的な`--no-env-pull`指定の存在は公式説明にあるが、アカウント接続／ファイル変更を伴う操作そのものは今回禁止。
- 公式出典：https://neon.com/blog/neon-functions-backend-logic-next-to-your-data 、https://neon.com/blog/introducing-neon-ts 、https://neon.com/blog/branch-first-dev-loop 、https://neon.com/blog/save-tokens-with-neon-function-templates

## 2. 現行コードとの照合
| 要素 | ソース・状態 | 未受入条件 |
|---|---|---|
| HTTP関数入口 | `functions/cs03-progress.mjs` はdefault `fetch(request)`を持つ | 実Neon runtimeでのモジュール読込・レスポンス |
| 依存 | `pg`・`jose`は`package.json` dependencies。Node標準`node:crypto`・`node:module`、CommonJS `progress-api.js`に依存 | Neonのビルドがこれらと相対importを正しくbundle/解決するか。Node 24というだけでは証明できない |
| Branch | 隔離branch `br-snowy-truth-a162pmdt` / project `quiet-mouse-39990305` | deployの実ターゲットが**非default branch**に固定された証拠。defaultへの配置禁止 |
| DB | `CS03_TEST_DATABASE_URL`が`cs03_auth_sandbox`・`cs03_progress_api`・指定endpoint・`sslmode=verify-full`と一致しなければ停止 | Neonの自動`DATABASE_URL`ではなく、CS-03用の限定権限接続を**server only**で利用できるか |
| シークレット | `CS03_ORIGIN_SECRET`はFunction側、`CS03_GATEWAY_SECRET`はWorker側 | 同じ32 UTF-8 bytes以上の秘密を両方の環境の非公開領域で扱えるか。実値をGitHub/チャット/ログに置かない |
| JWT | `src/neon-jwt-verifier.mjs` + 固定issuer/audience/JWKS | 実隔離Authの鍵と署名検証実通信。偽造・期限切れ拒否 |
| ルート | Functionの`/progress`に対しWorkerの専用経路のみ | Function直アクセスの401拒否、公開URL所有先、Cloudflareの無料枠超過時のfail-closed |

## 3. カスタムenvの扱い：確認済み／未確定
- **コード上必要な4種類**：`CS03_ORIGIN_SECRET`、`CS03_ISOLATED_BRANCH_ID`、`CS03_TEST_DATABASE_URL`、およびもしNeonが自動設定するなら`NEON_BRANCH_ID`の一致。後者はアプリが自動設定有無を断定しない。
- **公式で一部確認済み**：Function宣言とデプロイに`neon.ts`、envをCLIに渡す方法の例が存在する。
- **未確定**：現行NeonプロジェクトのFunctions利用権限、custom envの実保存方式/スコープ/ランタイムへの注入、`pg`・`jose`・CommonJS依存のNeonビルド互換、秘密更新/失効の可否、FunctionのURL所有証拠。未確定のまま実配置に進まない。
- **禁止**：`neon link`、`neon checkout`、`neon env pull`、`neon deploy`、`neon config apply`、テンプレート自動作成、実秘密値を含む`--env`ファイル生成を今回実行しない。

## 4. 実配置前の判断ゲート
1. **D1（現在／読み取り）**：Functionのソース宣言形式・依存・環境変数名・停止・Branch/Account境界をレビュー。静的ローカル追加試験31/31 PASSは既に実施済み。これを実Functions合格とは扱わない。
2. **D2（未完了）**：Neon管理画面・公式仕様・現在プランで、Functions有効化と安全なカスタムenv注入方式、秘密の扱い、限定Branch指定を**実秘密を見ず**に確認。ここで勝手にNeon CLIをリンクしない。
3. **D3（未承認）**：対象project、隔離branch、専用Freeアカウント、HTTP入口方式、秘密・DBロール、予想利用量／料金、停止・切戻し方法を運営者に示し、**独立した実配置承認**を受ける。
4. **D4（承認後のみ）**：隔離Functionのビルド・配備、実環境env・依存解決、直接呼出拒否、Worker/DOの隔離上限、実API通信を検証。Cloudflare本番公開/CSP変更はさらに別承認。

**状態**：現行のレビュー/監査文書とテストは保持。Cloudflare／Neonリソース・課金・GitHub Actions・本番mainは変更していない。**NO-GO**。

## 5. Neon実アカウントと公式API仕様の直接照合（2026-11-23）

**実Neon connectorの読み取り結果**（Project `quiet-mouse-39990305`, branch `br-snowy-truth-a162pmdt`）：対象branchは`ready`、`default:false`、Neon Functionsの`list_functions`は空配列（0件）。実Functionや環境変数は登録していない。

**Neon公式ドキュメントの直接読取**（Functions environment variables / Deploy and manage、2026-11-09更新）：
- Functionsは**Node.js 24**。Neon Functions CLI `neon functions deploy <slug> --src <path>` は既定でesbuildによりbundleし、ソースをZIP化してアップロードする。 `--branch` と `--project-id` があり、**常に対象非default branchを明示**して実行する設計が可能。CLI設定の既定branchに頼らない。
- `neon functions deploy` の`--env KEY=VALUE` は**CLIの引数として値を渡す方式**で、`neon deploy --env path`とは異なる。秘密をシェル履歴／プロセス引数に露出させないため、具体的な登録手段は承認時に別途選ぶ。秘密の実値をこの文書・GitHub・チャット・CIログへ書かない。
- 新しい**各Functionデプロイに環境変数のスナップショット**が付属する。CLIではenvの変更もコードを再bundleする。API経由なら既存Functionに対して`zip`なしでenv/runtimesのみを更新可能。**Function未登録の初回デプロイにはZIPが必須**。値の削除はCLI `--env KEY=`で可能と公式記載があるが、事故時の実際の失効と反映タイミングは検証していない。
- Neonが注入する `DATABASE_URL` はbranch-scoped。ただしCS-03は最小権限`CS03_TEST_DATABASE_URL`の専用接続とTLS検証を要求。Neon自動`DATABASE_URL`を代替として使わない。
- `neon.ts`方式は`neon deploy`が**関数以外のbranch policy全体**を適用するため、Function以外の変更リスクもある。CS-03の最小配置では**既存DB/Auth等を意図せず変更しない方式**の採用を優先し、`neon deploy`を無承認で実行しない。
- FunctionソースのエントリとbundleはCLI側で管理でき、事前にソース`functions/cs03-progress.mjs`と`pg`/`jose`/CommonJS相対依存をローカルでビルドできるかは**まだ未実証**。
- 環境変数の制限は**最大1000件、合計32KiB**（Neon注入分も実行時の上限に関わる）。必要最小限のみ登録する。
- **残る具体的な互換性懸念**：Neon Functionの`invocation_url`はFunction識別子のルートで、現行CS-03のFunction/Workerとも`/progress`を要求する。実URLと`/progress`の経路が成立することは未確認であり、勝手にURLを捏造・公開しない。

公式参照：
- https://neon.com/docs/compute/functions/environment-variables
- https://neon.com/docs/compute/functions/deploy
- https://neon.com/docs/cli/functions

**判定**：『カスタムenv設定方式が存在するか』『非default branchを明示できるか』は仕様上確認済み。『実環境でのsecret保管と更新』『bundle/Node互換』『Function URLと`/progress`』『実非default branchへの動作確認』はOPEN。ユーザーの個別承認までは**Neon Functions deploy、config apply、env pull、秘密登録、Cloudflare配置、課金変更を行わない**。CS-03公開・実クラウド配置**NO-GO**。

## 6. Neon Functionのローカル単一ファイルビルド・経路検証（追加試験待ち）

Neon公式`docs/compute/functions/deploy`のesbuild方式に合わせ、Node24 / ESM / node-platformの**一時ディレクトリへのビルドのみ**を試みる`tests/cs03-neon-function-offline-bundle.test.mjs`を追加。ソースを単一`index.mjs`へ束ね、`pg`、`jose`、`src/progress-api.js`、`src/progress-access.js`がメタファイルに含まれることを検査し、生成したモジュールの`default.fetch`をローカルで呼ぶ。

**ローカルソース改修**：`server/cs03-runtime.mjs`の相対`require('../src/progress-api.js')`（`createRequire(import.meta.url)`）を**静的なCommonJS default import**に変更。相対パスの動的`require`がbundle時に外部依存として残る可能性を避けるため。既存`tests/cs03-neon-function-runtime-contract.test.mjs`の該当ソース検査も新方式に合わせて変更。これら2ファイルに変更があるため、今回の追加ビルド試験と**既存Neon runtime contractの該当5件**の再実行が必要である。

**新しい試験が確認すること**：
- ローカルNode 24ターゲットbundleへのPG/JWT/認可API取り込み、生成された`index.mjs`のimport
- 関数URLの`/`は現行コードでは404、`/progress`へ秘密なしで呼ぶと401。**これがNeon実環境のURLルーティング互換性の証明ではない**。
- Node24ターゲットは実行ホストのNodeバージョンを24へ変更しない。試験環境で動けば正式Node24上で動く保証はない。
- esbuildは既存`devDependencies`から使い、ネットワーク／Neon CLI／秘密／実DB接続なし。一時`index.mjs`は試験終了時に削除。
- 追加テストは**まだ実行していないためPASS宣言禁止**。既存の31/31 PASSは旧版の合格実績であり、関係コード変更後の未再検証部分を区別する。

**実配置前に残る問題**：Neonの実`invocation_url`はFunction slugのルート。現在のコードはFunctionの`/progress`を要求し、Workerは同じpathに転送する設計。**実NeonのFunction URLに`/progress`を付与してHTTP handlerへ届くか、公式仕様だけで断定せず、実クラウドでの隔離受入までOPEN**。公開URLを推測して作成しない。NO-GO維持。

## 7. 開発PCビルド受入：6/6 PASS（2026-11-23）

操作者が開発PCでコミット `b243970b56d61cb72b3a9af7d9d0158a4d77cb24` をチェックアウトし、`node --test tests/cs03-neon-function-runtime-contract.test.mjs tests/cs03-neon-function-offline-bundle.test.mjs` を実行した。提出されたログは **6 tests / 6 pass / 0 fail**、`CS03_NEON_BUNDLE_TEST_PASS`。esbuildによるNode24ターゲットESM単一bundleとCommonJSのprogress handler取込、バンドル後のdefault fetch読込、秘密欠落時401、実行環境・隔離DB設定の静的ガード、非公開状態を確認。今回変更した実装に関連する既存5件も再試験済み。同一のソース状態では繰り返し不要。

**未完了**：Neon実ランタイムでのbundle起動、依存解決、隔離branchへの配置とenv注入、Function呼び出しURLのルート `/` と現行handler `/progress` の実ルーティング整合、秘密登録、実DB接続、上限超過時fail-closed。ローカル試験でのルート `/` 404は現行コードの挙動であり、実Neonのルーティング受入ではない。クラウド変更・課金変更・GitHub Actionsは一切行わず、**実配置・本番公開NO-GO**を維持する。
