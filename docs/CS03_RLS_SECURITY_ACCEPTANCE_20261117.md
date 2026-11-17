# CS-03 学習履歴アクセス制御・受入条件（2026-11-17）

## 適用範囲
資格学習アプリ `db-specialist-study` / Neon organization `Certification-Study` / project `certification-study` のみ。ツムタンゴには適用しない。
対象の試験ブランチは `cs03-auth-isolation-20261117`。本番DBや公開サイトへの変更は禁止。GitHub Actionsを使用せず、追加有料契約を行わない。

## 2026-11-17 実測（読み取り）
- `public.study_progress`: `user_id text`, `exam_code text`, `question_id text`, `data jsonb`, `revision bigint`, `updated_at timestamptz`。
- 主キー: `(user_id, exam_code, question_id)`。学習履歴 0 件。
- RLS 有効、`pg_policies` に許可ポリシー 0 件。
- `certification_study_owner` は `BYPASSRLS`。これを使った試験で一般ユーザーの隔離を判定してはならない。
- `neon_auth` ロールは `BYPASSRLS` なし、現時点の `study_progress` SELECT/INSERT 権限なし。
- `auth` スキーマには認証本人ID取得関数が見つからない。現環境の `auth.user_id()` を存在するものとしてポリシーに書かない。
- 本番側Neon Auth有効。ただし新規登録オフ。試験ブランチは `neon_auth` 9 テーブルとユーザー1件を継承しているが、Neon Auth サービスが未設定。新規有効化は既存スキーマと競合して停止。既存ユーザー・スキーマを削除しない。
- 試験ブランチ用Computeを最小0.25 CUで作成し、停止を指示済み。停止完了および無料枠消費量は別途再確認する。

## セキュリティ実装契約
1. 認証済みの本人IDは、署名・有効期限・発行元・対象を確認した信頼できる認証情報からサーバー側で求める。リクエスト本文/URLの `user_id` は本人判定に使わない。
2. 実装方式は認証サービスの接続方式確定後に決める。優先: API/Neon Functions側で検証済みIDによる絞り込み・更新を強制。DBのRLSは二重防御として適切な非BYPASSRLSロールと検証済みIDコンテキストに結びつける。DB所有者接続文字列や秘密鍵をブラウザへ渡さない。
3. PostgreSQLのRLSポリシーは、正式なJWT→セッションコンテキスト/ロールの対応が確定するまで追加しない。未確認の `current_setting` 値をブラウザに設定させる方式は不可。
4. 他人の履歴について SELECT/INSERT/UPDATE/DELETE の全操作を拒否する。未ログイン・不正/期限切れJWTも拒否する。サーバー・DBの双方で権限を絞る。
5. 同期は `(user_id,exam_code,question_id)` ごとの更新競合、重複送信、旧端末のデータとの統合、オフライン復帰、ログアウト時の状態消去を別途試験する。
6. 初回公開は認証試験完了まで無効（Fail Closed）。本番切替の前にレビューする。

## 必須の自動受入試験（現時点ですべて未実施）
| ID | 操作 | 期待 |
|---|---|---|
| RLS-01 | Aの検証済み認証情報でAの履歴を読む | Aのみ取得 |
| RLS-02 | Aの認証情報でBの履歴を読む | 0件または拒否 |
| RLS-03 | Aの認証情報でBの履歴をINSERT/UPDATE/DELETE | すべて拒否 |
| RLS-04 | 未ログインで履歴を読む/書く | 拒否 |
| RLS-05 | 不正署名・期限切れトークンで要求 | 拒否 |
| RLS-06 | リクエストのuser_idをBへ改ざん | Bにアクセスできない |
| RLS-07 | DB所有者と通常ロールで同じテストを比較 | 所有者の成功をRLS合格として扱わない |

## 次の実行条件
- Neon Authの試験ブランチ競合を、既存ユーザーを失わずに解決する方法を確定する。破壊的操作は行わない。
- 運用するAPI方式・JWT検証方式・非BYPASSRLS接続ロールを確定。
- その後、上記7試験を隔離環境で実行し、結果を記録する。
