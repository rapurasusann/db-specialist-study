# CS-03 Neon Functions依存・環境変数レビュー（2026-11-23）

**状態：オフライン構成レビュー完了、追加5件の開発PC実行待ち。実Neon Function/Cloudflareは未配置、NO-GO。**

## 1. 公式実行モデル（公開情報）
- Neon Functionsは**Node.js 24**のHTTP実行環境で、Functionモジュールのdefault exportが`fetch(request)`を提供する。Functionは`neon.ts`等の宣言によりbranchに配置する。現行の`functions/cs03-progress.mjs`のdefault export形式は整合。
- `DATABASE_URL`はNeonにより自動注入されるが、CS-03のソースは**意図的にこれを直接使わない**。意図せず既定ユーザーやdefault branchに接続しないため、別途`CS03_TEST_DATABASE_URL`と`CS03_ISOLATED_BRANCH_ID`を要求する。
- 公式資料: https://neon.com/blog/neon-functions-backend-logic-next-to-your-data ; https://neon.com/blog/introducing-neon-ts ; https://neon.com/blog/save-tokens-with-neon-function-templates

## 2. 依存ライブラリとモジュール形式
| 対象 | 使用法 | `package.json`内 | 状態 |
|---|---|---|---|
| `functions/cs03-progress.mjs` | `node:crypto`（`timingSafeEqual`） | Node組込 | 静的整合 |
| `server/cs03-runtime.mjs` | `pg`と`node:module`によるCommonJS読み込み | `pg`がdependencies | 静的整合 |
| `src/neon-jwt-verifier.mjs` | `jose` | `jose`がdependencies | 静的整合 |
| `src/progress-api.js` → `src/progress-access.js` | CommonJS `require` | repo内ファイル | 静的整合 |

**重要**：実Functionのビルド対象への`pg`/`jose`/CommonJS依存の取り込み、Neon CLI/設定による解決は**未確認**。単にpackage.jsonに書かれていることはNeonでの正常起動・DB接続の実証ではない。公式のNeon Functionsの構成手順では`neon.ts`と配置用ツール／パッケージが必要だが、本リポジトリに実配置可能なNeon構成は作成しない（個別承認前）。

## 3. 秘密・環境変数の必要条件
| 対象 | 変数 | 制約 |
|---|---|---|
| Neon Function | `CS03_ORIGIN_SECRET` | Workerの`CS03_GATEWAY_SECRET`と同じ32 UTF-8 bytes以上のサーバー秘密。HTTP `x-secret`を検証。値はGitHub/ログに保存しない |
| Neon Function | `CS03_ISOLATED_BRANCH_ID` | `br-snowy-truth-a162pmdt`に完全一致 |
| Neon Function | `CS03_TEST_DATABASE_URL` | `cs03_auth_sandbox`の`cs03_progress_api`、指定Neon endpoint、`sslmode=verify-full`。別DBやdefault branchのURLは拒否 |
| Neon Function | `NEON_BRANCH_ID`（設定された場合） | 同じ隔離branch IDに一致すること。Neonによる自動提供の有無・形式は未確認 |
| Worker | `CS03_NEON_FUNCTION_URL` | 実配置後に隔離branchに属するURLを証拠により確認。推測やサンプルURLを設定しない |
| Worker | `CS03_JWKS_URL` / `CS03_JWT_ISSUER` / `CS03_JWT_AUDIENCE` | 隔離Neon Authの実値を照合。JWT検証を省略しない |

**NeonのカスタムenvをFunctionへ注入する正式な方式・そのスコープ・値の反映タイミングは実環境未確認**。Neonの自動`DATABASE_URL`へ安易に置き換えたり、URLを公開ドキュメントに書かない。Neon CLIの`env pull`はローカルへ秘密を保存しうるため、無承認で実行しない。

## 4. 開発PCでの追加試験
`tests/cs03-neon-function-runtime-contract.test.mjs`に**新規5件**（実行待ち）を追加した。
1. Functionがdefault fetchと秘密検証を持つこと
2. Functionの内部依存閉包（`pg`, `jose`, Node標準, CommonJS）とpackage宣言の整合
3. 自動提供の`DATABASE_URL`に依存せず隔離DB/role/TLSを強制すること
4. 秘密がない場合にDB runtime生成前で401拒否すること
5. 明示的な公開禁止状態を維持すること

これらは**静的・ローカル試験**。テストPASSでも実Neonでのパッケージ解決と環境注入、URL所有権、課金/上限を受入済みにはしない。

## 5. 次の未完了条件
- Functionsの実ビルド/依存解決とcustom envの正式な登録方式、専用branchへ配置できる権限と安全停止手順を読み取りで確定する。
- 非公開・限定Ingressの設計、正式Workerの一時停止制御、Neon Function直接アクセス拒否、無料枠超過時fail-closedを別途受入する。
- 実クラウド操作が必要なら**対象リソース・無料枠・費用・停止策を提示して運営者の個別承認を得る**。Worker/DO/Function生成、秘密登録、公開URL/CSP変更、課金変更、GitHub Actionsは本工程で実行しない。

**公開判定NO-GO**。
