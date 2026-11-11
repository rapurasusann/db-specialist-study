# PC・スマホ学習履歴同期：実装基盤（未接続）
更新: 2026-11-11

## 確定事項
- GitHub Pagesは教材と画面のみ配信。一般公開を前提とする。
- 学習記録の共有は、Wordbook・ParkWaitとは別のNeon **専用プロジェクト**を利用する。
- Neon Authの検証済みJWT + Neon Data API + DBのRLSで利用者ごとのアクセスを制限する。
- ユーザー本人が確認したGitHub 2FAは有効。main ruleset id=27029006。
- 既存の「年度を追加（JSON）」機能は削除しない。

## 現段階の作業
- `sql/001_study_progress.sql` を作成。**まだどのDBにも実行していない。**
- 現行公開版のCSPは `connect-src 'self'` のため外部DB通信を意図的に阻止する。同期を設定するまでは変更しない。
- 現行アプリはlocalStorageに保存し、手動のバックアップ／復元が可能。
- **実際の端末間同期はまだ動作しない。**

## 同期実装の受入条件
1. 専用のNeonプロジェクトに限定してSQLを実行。既存のNeon・Supabase・Renderに変更を加えない。
2. AuthとData APIを有効化し、登録を本人に限定する（一般公開のサインアップを必要に応じて停止）。
3. 権限検証: 未認証アクセス拒否、別ユーザーのSELECT/INSERT/UPDATE/DELETEをすべて拒否、本人のみ可。
4. 同一問題をPCで保存→スマホで同期→同じ履歴を再現。逆方向も確認。
5. オフライン保存と再接続後の同期を確認。競合時の扱いは更新時刻だけに依存せず、データ喪失のない規則を検証する。
6. CSPの `connect-src` は確定したAuth/Data APIのhttpsオリジンだけをホワイトリスト化し、変更したscriptのハッシュを更新する。
7. バックアップ機能と年度追加JSONは維持。同期が失敗した場合もローカル履歴を失わない。
8. 既存コードにあるSupabase用のセッショントークンをlocalStorageに保存する部分は、そのまま有効にせず見直す。

## 外部依存・費用
現有Neon組織はLaunch。新しいプロジェクトは既存プロジェクトとDB/computeが別でも組織の請求に影響する可能性がある。
未承認のプロジェクト作成・DB変更・課金操作は実施しない。
無料枠と完全分離の条件を満たす別組織を用意する場合、ユーザー本人の組織指定が必要。

## 公式資料
- https://neon.com/docs/auth/authentication-flow
- https://neon.com/docs/introduction/plans
