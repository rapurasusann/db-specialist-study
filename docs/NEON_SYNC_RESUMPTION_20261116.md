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
| CS-02 | 資格横断の問題ID・履歴仕様 | 資格IDの新旧変換を実装、旧DBキーを維持して既存画面の保存・集計に適用。Nodeとブラウザ試験待ち | IN REVIEW |
| CS-03 | Neon Auth方式の決定 | 認証方式、利用可能なAPI、ブラウザに置ける公開情報を実際に確認 | OPEN |
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
