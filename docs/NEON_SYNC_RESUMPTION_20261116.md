# 資格学習アプリ：開発再開とNeon同期移行計画（2026-11-16）

## 現行確認（コードと接続先）

- リポジトリ: `rapurasusann/db-specialist-study`、正本ブランチ `main`。公開先は GitHub Pages。
- 2025年度DB午前Ⅱの問題・解説25件、用語辞書31語、選択肢シャッフル、ブラウザ内の学習履歴とJSONバックアップ／復元が存在する。
- 学習履歴は `localStorage['db-study-progress-v1']`。問題キーは現在 `年:科目:問番号`（例 `2025:am2:1`）。回答結果・習熟度などを問題キー単位のJSONで保存する。
- `index.html` の既存クラウド同期は **Supabase専用**（`*.supabase.co`、`/auth/v1/`、`/rest/v1/db_study_progress`）。`cloud-config.js` は空欄で、現在の公開コードだけでは同期は有効にならない。
- Neon の別プロジェクト `Certification-Study / certification-study`（project ID `quiet-mouse-39990305`、Singapore、PostgreSQL 18）が存在することを確認。
- **NeonにDBを作成したことと、Neon Auth・API・同期が実装済みであることは別**。現行Supabase用コードにNeonの接続文字列を設定しても動かない。
- この計画ではツムタンゴのDBや学習履歴には触れない。

## 最小実装の工程（重複しない順番）

| ID | 工程 | 完了条件 | 状態 |
|---|---|---|---|
| CS-01 | 現行コード・接続先棚卸し | ローカル保存形式、Supabase依存、Neonプロジェクトを明記 | CLOSED |
| CS-02 | 資格横断の問題ID・履歴仕様 | 新旧問題ID互換・保存・集計を実装し、Node 8/8・Playwright UI-01〜09受入PASS | CLOSED |
| CS-03 | Neon Auth方式の決定 | Neon Auth設定・許可元を確認済み。Data API未設定、クライアント接続・権限方式検証待ち | IN PROGRESS |
| CS-04 | Neon DBテーブル・権限 | 本人以外の読み書き拒否、主キー、更新時刻、型検証を隔離環境で試験 | OPEN |
| CS-05 | 同期APIの実装 | ブラウザへDBパスワードを出さず認証済みユーザーに限定した読み書き | OPEN |
| CS-06 | 競合・復元・アカウント分離 | 2端末競合、ログアウト・ユーザー切替、旧バックアップを試験 | OPEN |
| CS-07 | 統合・UI・公開確認 | PC/スマホで操作、失敗時のローカル保持と同期状態を確認 | OPEN |
| CS-08 | DB以外の資格追加 | PM・セキスペ等の資格IDと年度別教材の独立を確認 | OPEN |

## CS-02の暫定設計（まだ実装・承認ではない）

- 旧キー `2025:am2:1` は **DB資格としてのみ** `db:2025:am2:1` に解釈する。現在のバックアップは削除も上書きもしない。
- 共通キーは `examId:year:courseId:number`。受け付ける `examId` は明示的な資格一覧に限定し、任意文字列をSQLの識別子として扱わない。
- `user_id`（認証された利用者）、`question_id`（共通問題ID）、`data`（既存進捗JSON）、`updated_at`（UTC）を基本項目とする。ユーザーIDをクライアントの申告だけで信用しない。
- 保存は `(user_id, question_id)` で一意。サーバー時刻、同時更新、端末の時計ずれに関する競合ルールはCS-05前に確定する。
- 既存の `localStorage` とJSONバックアップ／復元はNeon連携後も残す。同期失敗で端末の履歴を消さない。
- 別の認証ユーザーへの端末内履歴の自動アップロードは禁止。切替時には分離・明示選択・テストを実施する。
- GitHub PagesのクライアントにNeon接続URL（パスワード入り）、サービスロール鍵、秘密API鍵を埋め込まない。

## 注意点

1. 現行 `syncAll()` は `^\\d{4}:(am1|am2|pm1|pm2):\\d{1,3}$` のキーのみを同期し、PM/セキスペ等の資格IDは未対応。共通ID導入時はこの制限の変更と回帰試験が必要。
2. 現行の日時比較は端末の `updatedAt` と遠隔側 `updated_at` の単純比較であり、厳密な同時更新競合の解決策ではない。
3. 現行同期はSupabase固有。Neon側の認証・Data APIの使用条件を確認するまでは「同期済み」と判定しない。
4. `index.html` のインラインJavaScript変更時はCSPのSHA-256を再計算し、既存のテストを通す。
5. GitHub Actionsは開発PC復帰後の通常作業では使用しない。変更は作業ブランチからPRでレビューし、無検証でmainへ反映しない。

## 2026-11-16 CS-02 実装記録

- `src/question-identity.js`: 資格ID（db / pm / sc）付き問題キーの厳格な解析・生成、DB旧キーの正規化、DB旧キーへの逆変換。
- `index.html`: 新しいモジュールを先に読み込み、現在のDB学習履歴の保存・取得・科目別集計・問題一覧で `progressKey()` を利用。DBについては **従来のキー文字列をそのまま使用する**。進捗を無断で移行・複製・消去する機能は追加しない。
- `tests/question-identity.test.js`、`tests/question-identity-integration.test.js`: 資格間の衝突防止、旧キー互換、画面への接続、旧バックアップ維持を検査するNodeテストを追加。
- インラインJavaScriptのCSP SHA-256を更新し、コードとハッシュを照合した。
- GitHubからのコード読み戻しとV8実行・構文確認: 28チェック PASS。ただし **Nodeの全テスト・実ブラウザ検証はまだ未実施**。CS-02はCLOSEDにしない。
- 現行のSupabase専用同期は資格IDを含むキーには対応していない。CS-05でNeon APIへの置き換え時に資格別キーの同期を試験する。現在は同期設定自体が空欄である。

## 直近の次作業

**CS-02受入**: 開発PCで `node --test tests/*.test.js` を実行し、GitHub Pagesを変更する前にPC/スマホ相当の動作検証を行う。既存履歴の表示・編集・JSONバックアップ／復元、問題切替、集計、CSPを確認。PASS後にCS-02をCLOSEDとする。続けて **CS-03** のNeon Auth/API接続可能性を確認する。

## 2026-11-16 追加受入検証

- GitHubの作業ブランチからコードを再取得し、JavaScript構文、資格別問題ID、旧キー互換、バックアップ維持、午前Ⅱ25問の解説、用語辞書を **69チェック PASS**。
- この69件はGitHub取得コードに対する独立した構文・ロジック検査であり、`node --test` の全テスト実行や実ブラウザE2Eの代替ではない。
- 実行環境からGitHubへの直接Git通信はDNSで失敗したため、開発PCのリポジトリでのテストが必要。
- 開発PCでの確認コマンド（PowerShell一行）: `$p=Join-Path $env:USERPROFILE 'source\repos\db-specialist-study'; if(!(Test-Path $p)){throw 'REPOSITORY_NOT_FOUND'}; git -C $p status --short; git -C $p fetch origin docs/neon-sync-resumption-20261116; if($LASTEXITCODE -ne 0){throw 'FETCH_FAILED'}; git -C $p -c advice.detachedHead=false switch --detach FETCH_HEAD; if($LASTEXITCODE -ne 0){throw 'SWITCH_FAILED'}; Push-Location $p; try {node --test tests/*.test.js; Write-Host "TEST_EXIT_CODE=$LASTEXITCODE"} finally {Pop-Location}`。
- 上記コマンドは既存の未コミット変更のある作業ツリーでは実行しないこと。個別検証用フォルダまたはクリーンなリポジトリに限定する。

## 2026-11-16 開発PC Nodeテスト結果・CS-03 読み取り調査

### CS-02

- 開発PCの隔離試験フォルダ `%TEMP%\\db-study-cs02-verify-20261116` で `node --test tests/*.test.js` を実行。
- 8件 PASS、0件 FAIL、`TEST_EXIT_CODE=0`（ユーザー提供のログ）。CSPテストのWindows CRLF対応後に合格。
- GitHub上の読み戻し69チェックもPASS。**ブラウザの画面操作・古い実データでのバックアップ/復元受入試験は未実施**。このためCS-02状態はIN REVIEWを維持。

### CS-03：Neon設定読み取り

- プロジェクト: `certification-study`（project ID `quiet-mouse-39990305`）、ブランチ `main`（`br-nameless-pond-a1ucyf2q`）、DB `certification_study`。
- Neon Auth: 設定あり（Better Auth）、許可元 `https://rapurasusann.github.io`、localhost許可、メール/パスワード認証あり。新規サインアップは無効。共有Google OAuthプロバイダも登録されている。
- **Neon Data API: 対象DBで未設定（API取得 404）**。既存のSupabase REST URL/認証処理をそのまま転用できない。
- 本番の認証やDB設定は読み取りのみ、変更なし。
- 次の設計項目: Data APIの利用条件・JWT認証連携・ユーザー別行アクセス制御を確定し、テストブランチで検証する。秘密鍵やDBパスワードを公開HTMLへ追加しない。

## 2026-11-17 CS-02 最終受入判定（最新正本）

- 開発PCで `node --test tests/*.test.js`：**8件PASS、0件FAIL、TEST_EXIT_CODE=0**（既出ログ）。
- 開発PCの隔離試験フォルダでPlaywright自動ブラウザ試験 `tests/browser.e2e.spec.cjs`：**1テスト PASS（UI-01〜UI-09をすべて実行）、E2E_EXIT_CODE=0**。所要4.7秒（ユーザー提出ログ）。
- 手動でもUI-01〜UI-07の結果を画像とバックアップJSONで確認した。UI-08/09はPlaywrightで実施済み。
- **CS-02 = CLOSED（受入条件達成）**。これ以前の「ブラウザ検証未実施」「IN REVIEW」の記述は経過記録であり、現行判定はこの節を優先する。
- 対象はローカル試験ブランチ。GitHub Pages公開・PRマージは未実施。クラウド同期（Neon Auth・Data API・権限制御）はCS-03以降に残る。
- 次に行うべきこと：**CS-03** のNeon Auth/Data API連携方式・クライアントに渡せる情報・行単位認可の確認と実装計画へ進む。CS-02同一試験の再実行はコード変更や不具合発生時だけでよい。
