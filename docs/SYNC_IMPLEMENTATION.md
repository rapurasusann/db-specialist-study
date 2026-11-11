# PC・スマホ学習履歴同期：実装基盤（未接続）
更新: 2026-11-11

## 確定事項
- GitHub Pagesは教材と画面のみ配信。一般公開を前提とする。
- 学習記録の共有は、Wordbook・ParkWaitとは別のNeon **専用プロジェクト**を利用する。
- Neon Authの検証済みJWT + 専用Neon Function API + DBの権限チェックで利用者ごとのアクセスを制限する。Data APIは現段階で有効化しない。
- ユーザー本人が確認したGitHub 2FAは有効。main ruleset id=27029006。
- 既存の「年度を追加（JSON）」機能は削除しない。

## 現段階の作業
- `sql/001_study_progress.sql` を作成。**まだどのDBにも実行していない。** DB導入前にManaged AuthのDBユーザーID型とRLS関数を確認する。
- `src/sync-merge.js` は競合候補を検出する純粋関数、`src/sync-transport.js` はJWTを送る専用API通信層。どちらも本番画面には未接続。
- 端末間同時更新にはサーバー側の原子的revision比較・不一致時HTTP 409が必要。SQLのrevision列だけでは実現できない。
- 現行公開版のCSPは `connect-src 'self'` のため外部DB通信を意図的に阻止する。同期を設定するまでは変更しない。
- 現行アプリはlocalStorageに保存し、手動のバックアップ／復元が可能。
- **実際の端末間同期はまだ動作しない。**

## 同期実装の受入条件
1. 専用のNeonプロジェクトに限定してSQLを実行。既存のNeon・Supabase・Renderに変更を加えない。
2. AuthとFunctionsを有効化し、登録を本人に限定する（一般公開のサインアップを必要に応じて停止）。
3. 権限検証: 未認証アクセス拒否、別ユーザーのSELECT/INSERT/UPDATE/DELETEをすべて拒否、本人のみ可。
4. 同一問題をPCで保存→スマホで同期→同じ履歴を再現。逆方向も確認。
5. オフライン保存と再接続後の同期を確認。競合時の扱いは更新時刻だけに依存せず、データ喪失のない規則を検証する。
6. CSPの `connect-src` は確定したAuth/Functionsのhttpsオリジンだけをホワイトリスト化し、変更したscriptのハッシュを更新する。
7. バックアップ機能と年度追加JSONは維持。同期が失敗した場合もローカル履歴を失わない。
8. 既存コードにあるSupabase用のセッショントークンをlocalStorageに保存する部分は、そのまま有効にせず見直す。

## 外部依存・費用
2026-11-11時点で確認できたNeon組織はWordbookとWordbook-A076-Loadの2つで、両方ともLaunch。専用プロジェクトは存在しない。新しいプロジェクトは既存プロジェクトとDB/computeが別でも組織の請求に影響する可能性がある。
未承認のプロジェクト作成・DB変更・課金操作は実施しない。
無料枠と完全分離の条件を満たす別組織を用意する場合、ユーザー本人の組織指定が必要。

## 公式資料
- https://neon.com/docs/auth/authentication-flow
- https://neon.com/docs/introduction/plans

## 2026-11-11: Free条件と実装状況
- Neon公式(2026-10-02): Freeは100プロジェクト、各100 CU-hours/月・DB 1GB。AuthとFunctionsを利用できる。利用上限を超えたときの挙動は本番接続前に確認する。
- 接続中の組織 `Wordbook` と `Wordbook-A076-Load` はいずれもLaunch。どちらにも新しいDBを作成しない。
- 現在のNeon接続は「組織作成」操作を提供していない。ユーザーがNeon ConsoleでDB学習アプリ専用の**Free組織**を作成し、組織名・Free表示を確認する必要がある。既存2組織のプラン変更は禁止。
- `neon.ts`, `functions/sync.ts`, `package.json` を追加。まだ未デプロイ・未結合・未試験。認証トークンのissuer/JWKS・CORS・データベーススキーマ・API整合は実接続時に確認する。
- `sql/001_study_progress.sql` はサーバーAPI経由専用。ブラウザにはDBパスワードもData APIも公開しない。Function側はJWT署名検証後に`sub`からuser_idを決定する。RLSの公開ポリシーは作らない。
- `src/sync-transport.js` は未接続。旧Supabase同期コードを本番で有効にしない。
- 実装上の次の課題: APIのGET/PUT契約試験、revision競合/401/異ユーザー確認、Neon Authのログイン画面、frontend統合、オフライン再試行、CSP更新、PCとスマホの実機試験。
