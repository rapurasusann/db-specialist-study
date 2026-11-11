# 複数資格のPC・スマホ学習履歴同期：実装基盤（未接続）
更新: 2026-11-11

## 確定事項
- GitHub Pagesは教材と画面のみ配信。一般公開を前提とする。
- 学習記録の共有は、Wordbook・ParkWaitとは別のNeon **専用プロジェクト**を利用する。
- Neon Authの検証済みJWT + 専用Neon Function API + DBの権限チェックで利用者ごとのアクセスを制限する。Data APIは現段階で有効化しない。
- ユーザー本人が確認したGitHub 2FAは有効。main ruleset id=27029006。
- 既存の「年度を追加（JSON）」機能は削除しない。

## 現段階の作業
- `sql/001_study_progress.sql` のテーブル作成部分を2026-11-11に専用DBへ適用済み。公開権限REVOKE・学習履歴RLS・3資格登録も読み取り検証済み。
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
【作成前の履歴】当初はWordbookとWordbook-A076-Loadのみ確認された。その後、ユーザーが独立Free組織を作成し、専用プロジェクトを新設した。新しいプロジェクトは既存プロジェクトとDB/computeが別でも組織の請求に影響する可能性がある。
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

## 複数資格対応への仕様更新（2026-11-11）
- 本来の目的は、DBスペシャリストに加え、将来のPM（プロジェクトマネージャ）・SC（情報処理安全確保支援士／セキスペ）を一つの学習基盤で管理すること。
- サービス専用のNeon Free組織・専用プロジェクトは **1組**。資格ごとにNeonプロジェクトを増やさない。
- DBの資格マスター `study_exam_catalog` に `db`、`pm`、`sc` を登録し、後から資格を追加できる。
- 学習履歴 `study_progress` の主キーは `(user_id, exam_code, question_id)`。年度・科目・設問のIDは既存互換の `2025:am2:1` を維持。DBとPMの同番号の問題は別レコード。
- APIは `GET /v1/exams/:exam/progress` および `PUT /v1/exams/:exam/progress/:id`。サーバーで認証したユーザーIDと資格コードの両方を条件にする。
- フロントエンドの端末内保存・インポートは現状DB専用のまま。将来は資格単位に名前空間を導入するが、既存のDB学習履歴は消去せず移行する。
- PM・SCの過去問データや教材は **未追加**。DB設計が対応したことは、各資格の教材完成を意味しない。
- 旧 `public.db_study_progress` は設計案だったが**実DBには未作成**。最初から新設 `public.study_progress` を使うため本番移行SQLは不要。
- 既存受入条件の「DBスペシャリスト専用テーブル」「/v1/progress」という古い表現より、本節の複数資格仕様を優先する。

## 2026-11-11 実Neon専用環境構築記録
- 専用組織: `Certification-Study`, org id `org-rough-cake-20008284`, **Free**。
- 専用プロジェクト: `certification-study`, project id `quiet-mouse-39990305`, Singapore `aws-ap-southeast-1`, PostgreSQL 18。
- 既定ブランチ: `br-nameless-pond-a1ucyf2q` (`main`)、DB `certification_study`。
- SQL適用済み: `public.study_exam_catalog`、`public.study_progress`。catalog = `db`,`pm`,`sc`。Neon readbackで2表と3資格を確認。
- `public.study_progress`: RLS enabled、PUBLIC/anon/authenticatedのテーブル権限なし。 `public.study_exam_catalog`: 公開権限なし。
- Neon Auth Managed Better Authを有効化。同期アプリ用Authが別DB内に作成され、Wordbookとは別。サインアップは無効化（allow_sign_up=false）、許可済みoriginは `https://rapurasusann.github.io`。
- **ユーザー作成済み**: 専用Neon Authに本人指定のメールアドレスで1件作成、DBで登録済みを確認。パスワード認証情報は0件であり、初期設定・本人ログインは未実施。
- **未完了**: Authでのサインイン/トークン検証、Neon Functionのデプロイ、APIの実リクエスト試験、旧localStorage履歴の同期処理接続、CSP・実機動作確認。証拠なしにCLOSEDとしない。
- public GitHub Pagesのv12は継続利用可能、今回変更なし。既存Wordbook/ParkWaitリソースは変更なし。

## 2026-11-11 同期衝突防止・ログイン画面ビルド（PR #2・未公開）
- `src/sync-engine.js`: revision と直近同期時の baseline データから、端末側とサーバー側の更新有無を区別。初回双方に別データがある場合・双方変更時・既知行のサーバー消失時は自動上書きせず競合として返す。端末の記録を保持。
- `tests/sync-engine.test.js`: 初回送信、初回受信、初回競合、片側変更、両側変更、削除疑い等の8場面を記述。**テストコードは追加済みだが実行結果は未取得**。
- `package.json`: `npm test` に merge/transport/engine、`npm run build:auth` にViteビルドを登録。
- `auth-src/` と `vite.auth.config.mjs`: 初期パスワード再設定・ログイン画面のソースとGitHub Pages向けビルド定義を追加。**本番公開・端末テスト未実施**。
- 初回に作成したAuthユーザーにはパスワード認証情報がまだない。実際に再設定メールを受け取って初期パスワードを設定できるか要検証。チャットでパスワードを受け取らない。
- 古い `index.html` のSupabase同期機構は現在 `cloudReady=false` のまま。Neon用 `src/sync-engine.js` は未接続。公開中の学習履歴保存・バックアップ・年度追加JSONは現状維持。
