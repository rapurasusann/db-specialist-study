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
