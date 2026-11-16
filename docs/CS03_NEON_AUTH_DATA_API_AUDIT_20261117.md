# CS-03 Neon Auth / Data API 既存構成調査（2026-11-17）

## 調査結果（読み取りのみ）

- Neon project `quiet-mouse-39990305` / default branch `br-nameless-pond-a1ucyf2q` / database `certification_study`。
- Neon Auth: Better Auth 接続済み。許可オリジン `https://rapurasusann.github.io`、localhost許可、メール・パスワード認証は有効、自己登録は無効。
- Neon Data API: 未プロビジョニング（取得時404）。既存のSupabase向け `index.html` のAPI経路をそのまま使用できない。
- `public.study_exam_catalog`: `db`, `pm`, `sc` の3資格を登録済み。
- `public.study_progress`: `user_id text`, `exam_code text`, `question_id text`, `data jsonb`, `revision bigint`, `updated_at timestamptz`。主キー `(user_id, exam_code, question_id)`、`data` 16,384バイト以内（DB側JSONBのテキスト）、`revision >= 1`。
- `question_id` CHECKは `20xx:(am1|am2|pm1|pm2):1〜100`。JSの問題ID（最大999）と異なるため、サーバー向け変換で100を上限にし、上限を超えるものは未同期として扱う。
- RLSは `study_progress` で有効。しかし `pg_policies` の結果は空（SELECT/INSERT/UPDATEポリシーなし）。
- 調査時点では `auth` スキーマのユーザー識別関数は未検出。PostgreSQL拡張は `plpgsql` のみ。一般ユーザー向けのテーブル権限も確認できていない。
- したがって **既存Neon DBは同期用テーブルがあるが、本人用のクライアントアクセスはまだ受入条件未達**。
- Neon AuthのJWT検証とData APIによるRLS連携の確定後に、テストブランチで認証あり/なし・本人/他人の読み書きを検証する。管理者ロールで通るだけでは合格としない。

## アプリ実装（作業ブランチのみ）

`src/neon-sync-record.js` は認証情報・ネットワーク・ブラウザ保存を扱わない純粋な変換器。
- 旧DBキー `2025:am2:1` → `exam_code='db'`, `question_id='2025:am2:1'`
- PMキー `pm:2025:am2:1` → `exam_code='pm'`, `question_id='2025:am2:1'`
- クラウドから読み取ったDB履歴は旧ローカルキーへ変換して、すでにあるデータの参照・バックアップを維持。
- 現行テーブルの制約値より大きい問題番号は同期対象外とする（黙って別の問題IDに振り直さない）。
- JSONデータの送信前サイズは安全側に最大15,000 UTF-8バイトとする。DBによる最終検査は別途必要。
- `tests/neon-sync-record.test.js` を追加。まだ同期APIには接続していない。

## 次の工程

1. CS-03-A: テストブランチでNeon Data APIを有効化し、AuthによるJWT発行・検証・必要なデータAPIロールと権限を確認。**本番mainでは有効化しない**。
2. CS-03-B: `auth.user_id()` など利用可能な本人識別方法を確認してRLSポリシーをテスト専用DBで作成。SELECT/INSERT/UPDATEは `user_id = auth.user_id()` の本人一致を条件とし、他人・匿名を拒否する。DELETEは初回不要なら付与しない。
3. CS-03-C: データAPIのCORS、認証Cookie/JWTの扱いと、複数ユーザーの認可負試験を確認。ブラウザにDBパスワード/秘密鍵を配置しない。
4. CS-04〜05: 認可の実証後、`study_progress` を用いた差分同期実装に進む。競合時はサーバーrevisionを採用する方式の是非を検討。
5. 同期無効のまま既存のローカル学習を継続させ、オフライン時も記録を維持する。

## 参考資料

- Neon Data API: https://neon.com/blog/a-postgrest-compatible-data-api-now-on-neon
- Neon AuthとRLS: https://neon.com/blog/neon-auth-branchable-identity-in-your-database
- RLSと認証ユーザーの制限: https://neon.com/blog/higher-level-crud-abstraction-for-postgres-rls

### 状態

CS-03: **IN PROGRESS**。本番設定変更、Data APIの有効化、ユーザー作成、実ログインは未実施。
