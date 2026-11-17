# CS-03 実DB RLS試験記録 (2026-11-17)

対象は `Certification-Study / certification-study / cs03-auth-isolation-20261117 / cs03_auth_sandbox` のみ。ツムタンゴ・資格アプリ本番DBは変更していない。

## 今回の変更
- 試験用 `cs03_progress_api` ロール作成。Neonで `read_write` を試験DBの `public` スキーマに限定。SQL上で `rolbypassrls = false` を確認。
- `study_progress` に `FORCE ROW LEVEL SECURITY` が設定済みであることを確認。
- `cs03_verified_owner` ポリシー追加: `app.verified_user_id` と `user_id` を SELECT/INSERT/UPDATE/DELETE で比較。
- 資格マスターへの書き込み権限を専用ロールから取り消し、SELECT のみに制限。
- 試験用マスター `db` 1件、試験用学習履歴 A/B 各1件を登録。

## 実行結果
| 試験 | 結果 |
| --- | --- |
| Aが自身のレコードを登録 | PASS |
| Aが自身のレコードを取得 | PASS |
| BがAのレコードを読む | 0件 PASS |
| BがAを更新する | 0件 PASS |
| BがAを削除する | 0件 PASS |
| BがAのIDでレコード登録 | RLS拒否 SQLSTATE 42501 PASS |
| 本人IDなしで読む | 0件 PASS |
| 本人IDなしで登録 | RLS拒否 SQLSTATE 42501 PASS |
| Bが自身のレコードを登録 | PASS |
| Aのレコードがその後も残存 | PASS |

## 重要な未完了事項
**今回の10件はサーバーが検証済みの本人IDをセッションにセットした場合を模擬したDB試験であり、Neon Authの実JWTからDBまでの一気通貫試験ではない。** PostgreSQLの任意設定 `app.verified_user_id` はそのDBロールにアクセスできれば自分で設定できるため、それ自体はなりすまし防止策ではない。DB接続文字列は必ず信頼できるAPIサーバーのみに保管する。ブラウザ・公開リポジトリへ接続文字列やDBロールパスワードを絶対に出さない。

次の優先作業: JWT検証器 `src/neon-jwt-verifier.mjs` と `src/progress-access.js` をサーバー上で接続し、検証された本人IDのみを用いて **同一DBトランザクション内で** `SET LOCAL` → SQL を実行する保存/取得APIを構築する。その後、A/B/未ログイン/偽造・期限切れJWTを使ったAPI経由実DB試験を実施する。
