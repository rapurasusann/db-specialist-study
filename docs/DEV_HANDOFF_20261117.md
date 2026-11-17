# DBスペシャリスト学習アプリ：引継ぎ票（2026-11-17）

## ユーザーの現在の指示
- 現在の環境ではPowerShell、Node、Gitなどの**ローカルコマンドを実行できない**。実行を求めて作業を止めず、GitHubやNeonの読み取り・ソース作業などコマンド不要で可能なことを優先。
- ここまでの状態を記録したうえで、**今すぐ最新のアプリで学習を始めたい**。
- GitHub Actionsは開発PC復帰後の通常運用では禁止。許可なしに使用しない。
- 本番データ／公開サイトは無断変更しない。ツムタンゴとこの資格学習アプリを混同しない。

## リポジトリと利用できる版
- `rapurasusann/db-specialist-study`、本番公開ソースは `main`。
- 公開サイト: `https://rapurasusann.github.io/db-specialist-study/`。端末内学習・JSONバックアップが利用可能（動作確認と継続学習はユーザーのブラウザに依存）。
- **開発最新版**はGitHub Draft PR #14、ブランチ `docs/neon-sync-resumption-20261116`。mainとHTMLのblob SHAが異なる。**PR #14は未マージ・未公開**であり、公開URLから開発最新版が使えると誤認させない。
- CS-02での改修は資格別問題IDの導入と旧DB履歴の互換性確保。既存教材・出題画面はそのままなので、DB午前Ⅱの学習は公開版から開始可能。
- ブラウザローカルの学習履歴はURL/オリジン単位に分離される。以前の `http://127.0.0.1:8765` の試験記録は公開GitHub Pagesの履歴に**自動転送されない**。既存の手動テストで取得済みの `db-study-backup-2026-11-16.json` を利用する場合は、本番側の既存記録を上書きするので事前に本番側のバックアップを取る。意図しない復元はしない。

## 工程と実績（最終判定）
- CS-01 CLOSED：既存ソース、旧Supabase同期コードとNeonの整理。
- CS-02 CLOSED：Node 8/8 PASS、Playwright headless Chrome 1/1 PASS（UI-01〜UI-09を含む）、`E2E_EXIT_CODE=0`。手動UI-01〜07とJSON内容確認もPASS。重複試験は原則不要。
- CS-03 IN PROGRESS：Neon Auth設定あり。既存 `certification_study` DBに `study_progress`、`study_exam_catalog`（db/pm/sc）あり。RLS ON、許可ポリシー未設定、Data API未設定。クライアント同期は未実装。
- CS-03対応用 `src/neon-sync-record.js` と `tests/neon-sync-record.test.js` をPR #14へ追加済み。GitHub読み戻し構文と主要5項目PASS。**追加したNodeテストは未実行**。旧DBの`2025:am2:1` を `exam_code=db` / `question_id=2025:am2:1` に変換し、PM/SCを別資格で区別。
- CS-04〜08：Neon行権限、同期実装、競合・アカウント分離、統合公開、他資格教材を後続工程とする。
- Neonプロジェクト `quiet-mouse-39990305`、DB `certification_study`、mainブランチ `br-nameless-pond-a1ucyf2q`。ツムタンゴのNeonとは別。無断変更なし。

## 再開時の順番
1. ユーザーが今すぐ学習したいので、まず公開版のリンクと2025 DB午前Ⅱ教材で学習を開始する。まだ開発PRのコードを公開版として案内しない。
2. 開発を再開するときはCS-03の追加Nodeテスト→Neon**隔離ブランチ**上のJWT/Data API/RLS本人・他人・匿名拒否試験。ローカルPCが使えない場合、GitHub・Neon側でできる安全な調査やソース作業に切り替える。
3. CS-03のテストやDB認可が整うまでPR #14のmainマージ、クラウド同期ONを実施しない。既存学習履歴の破壊や本番Neon変更をしない。
4. 進捗報告は簡潔に「今回やったこと／結果／リリースへの影響／次にやること」で記録。工程のCLOSEDを理由なく再OPENしない。

## 主な正本
- `docs/NEON_SYNC_RESUMPTION_20261116.md`
- `docs/CS02_BROWSER_ACCEPTANCE_20261116.md`
- `docs/CS03_NEON_AUTH_DATA_API_AUDIT_20261117.md`
- PR #14: https://github.com/rapurasusann/db-specialist-study/pull/14

## 2026-11-17 学習画面の改善：午前Ⅱ・問6

- ユーザー指示：午前Ⅱ・問6で表示される `【表の列】` と `【主なデータ例】` 以下の受注データ10行のテキスト転記は不要。
- `src/am2-2025-questions.js` の `2025:am2:6` の `stem` から重複した表転記のみ削除。設問本文、選択肢（ア2・イ3・ウ4・エ5）、公式問題冊子の画像表示（sourcePage=5）、解説、学習履歴の保存形式は変更しない。
- `tests/am2-q6-duplicate-table.test.js` を追加し、表文字列が再混入しないことを検証するテストを用意。
- GitHubの修正後ソースを読み戻し、表文字列削除・選択肢・原本参照・構文の静的確認はPASS。新しいNodeテストと実ブラウザ試験はユーザーのローカル実行環境が使用不可のため未実施。
- **Draft PR #14の作業ブランチに保存済み。main公開版には未反映**。ユーザーには公開版に修正が反映済みと案内しない。
