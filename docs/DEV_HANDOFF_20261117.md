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

## 2026-11-17 問6の公開反映結果（最新）

- main保護ルールによりファイル直接更新は409で拒否されたため、**単独PR #15** `https://github.com/rapurasusann/db-specialist-study/pull/15` を作成。
- 変更は `src/am2-2025-questions.js` の午前Ⅱ問6の余分な表文字列だけ。設問、選択肢、原本画像、残り19問は維持。GitHub V8ソース検証6項目PASS。
- PR #15を **squash merge成功**：`6fd73b8cf0204372a20d50043e784f352a67424b`。
- mainの対象ファイルを再取得し、修正ブランチと完全一致（blob `fdbc5b065ce9a20507f068e218b222662bfe09ff`）、余分な表がないことを確認。
- PR #14（CS-03開発）はDraftのまま、未完成のNeon連携はmainへ含めていない。GitHub Actionsの手動実行なし。
- GitHub Pagesの配信反映は別途検証が必要。学習ユーザーにはブラウザ更新案内を行う。

## 2026-11-17 午前Ⅱ問8・前後移動時自動採点（公開用mainへ反映）

- ユーザー要望：問8で原本画像と重複するSQL/表テキストは不要。「前の問題」「次の問題」で離脱する際、選択済みなら自動採点し理解度へ反映する。
- 問8の `stem` から `【表定義】` `【システム担当者（初期データ）】` `【トランザクションA】` 以下の重複転記を削除。選択肢4つ・設問・解説・公式画像参照 `sourcePage=7` を維持。
- `index.html` に `gradeCurrentAnswer` を追加。選択済みなら前後移動前に採点、`correct`、`attempts`、理解度（正解 `learning`／不正解 `review`）を保存。未選択時／移動先がない場合は採点しない。同じ選択肢を明示的に採点後の移動では二重採点しない。別選択肢に変更して移動する場合は新規採点。
- CSP inline SHA-256を更新し照合済み。回帰テスト `tests/am2-q8-auto-grade-navigation.test.js` を追加し、既存の `tests/am2-answers-and-reset.test.js` の判定条件を更新。
- 接続済みGitHubソースに対してV8実行・模擬遷移で正解/不正解、二重判定防止PASS。**ローカルの全Nodeテストと実ブラウザE2Eは未実施**（ユーザーPCコマンド不可・Actions禁止）。
- **独立PR #16** `https://github.com/rapurasusann/db-specialist-study/pull/16` を `main` にsquashマージ済み。マージコミット `07ec33d899875d73931ffe33fc60418f71d8862b`。mainから読み戻して変更の存在を確認。
- NeonやCS-03ドラフトPR #14のコードはマージしていない。GitHub Pagesへの配信タイミングは未確認。今後、公開版で前後移動の実操作による確認と、開発PC復帰後の全自動テストを行う。

## 2026-11-17 午前Ⅱ問9・11・12・23の重複表・図テキスト削除（最新）

- ユーザー要望：問9の名簿・SQL、問11の注文/注文明細、問12の処理内容・時系列、問23のディスク配置・パリティ計算の文章転記は不要。画像はそのまま残す。
- `src/am2-2025-questions.js` の4問の `stem` から指定された重複テキストだけを削除。設問本文・選択肢・解説・公式画像・学習履歴を維持。
- `tests/am2-duplicate-figures-q9-q11-q12-q23.test.js` を新設し、重複表示の再発防止チェックを追加。
- GitHub上でmainとの差分は4問の設問文字列のみ。ソース構文・設問・選択肢・画像参照を静的確認PASS。ローカルNode全試験・実ブラウザE2Eは未実施。
- 単独PR #17 `https://github.com/rapurasusann/db-specialist-study/pull/17` をmainへsquash merge。コミット `92a624fa6124862f916ce0be5fce5446897d444e`。
- main読み戻しで指定テキストが除去されていること、各問の選択肢4件、原本画像参照（問9=8頁、11=9頁、12=10頁、23=15頁）、回帰テストの存在を確認。GitHub Pages配信反映は別途確認。
- 未完成のCS-03やPR #14はmainにマージしていない。GitHub Actions未使用、PCコマンド要求なし。

## 2026-11-17 画像見切れ・古い教材テキストの一括修正（最新）

- ユーザー報告：午前Ⅱ問6/8/9/12の図表画像が歪む・見切れる。また問9/11/12/23で削除済みの表・SQL文字列が表示され続ける。
- 原因を調査。画像切り抜きロジック `src/am2-figure-clips.js` は固定座標SVG viewBoxを使っており、切り抜きによって元図表の一部が表示されなくなる。対象4ページのWebP原本を取得してサイズ852×1203を確認。
- 問6/8/9/12は切り抜きSVGをやめて、画像をネイティブ`img`で全ページ表示する方式に変更（`width:100%;height:auto;object-fit:contain`）。同梱原本ページ画像を維持。他のクリップは変更しない。
- 問9/11/12/23の冗長な文字起こしは前回PR #17ですでに`main`から削除済み。ブラウザが古い教材スクリプトを参照する可能性を低減するため、`index.html`からロードする`am2-2025-questions.js`と`am2-figure-clips.js`のURLに `?v=20261117b`を付与。データとCSPインラインスクリプトは不変更。
- `tests/am2-figure-fullpage-and-cache.test.js` を追加。ソース構文・4画像・4設問テキストの削除状態・バージョン指定の静的照合PASS。
- 単独PR #18 `https://github.com/rapurasusann/db-specialist-study/pull/18` をmainへsquashマージ完了。コミット `44606022dd3515e62a0d26050e008eccbb15bfff`。マージ後mainを再読込して変更反映PASS。
- 現時点で実ブラウザの視覚確認と、ローカルNode全試験は未実施。GitHub Pagesの配信反映も未検証。ユーザーはコマンド実行不可、Actionsは禁止。学習履歴を保護し、画面の再読込を案内する。
- **CS-03の未完成Neon同期コードはmainにはマージしていない。**

## 2026-11-17 修正訂正：問6は上部の補助画像だけをHTML表に置換（現行仕様）

- ユーザーから明確化：**画面下部の公式問題文PDF画像表示部は触らない**。問題文・選択肢欄に差し込まれた切り抜き図表だけを、再構成した受注データのHTML表に置換する。
- PR #19で導入した `document.getElementById('localViewer').classList.toggle('hide',isOrderTable)` は要求範囲を逸脱していたため撤去。下部ビューア用CSS `#localViewer{display:block!important}` も以前の状態に復元。
- 問6上部は9列×10行の `buildOrderTable()` を維持。下部の原本ページ画像は全問で従来どおり表示。問8等の画像もこの訂正で変更しない。
- `index.html` の図表スクリプトに `?v=20261117d` を付け、旧コードを参照しないようにする。回帰テストで表10行・下部ビューア非干渉を確認するよう修正。
- 独立PR #20 `https://github.com/rapurasusann/db-specialist-study/pull/20` をmainへsquashマージ（コミット `f8a7b3cf7a3a42bd78debc60768e9fe9f7c6cc54`）。mainソース再取得で表・ビューア不干渉・CSS復帰を確認PASS。
- **Node一式と実ブラウザ外観の最終受入は未実施**。GitHub Actionsは使用していない。GitHub Pages配信反映は未確認。
- **この節が問6の最新仕様**。これ以前の「問6で下部原本ビューアを隠す」という説明は誤り・撤回。

## 2026-11-17 問6表の横スクロール廃止（最新）

- ユーザー指示：問6の上部に再構成したHTML表は横スクロールなしで表示。画面下部の原本PDF表示は一切変更しない。
- `src/am2-figure-clips.js` の問6表について `min-width:770px` と `overflow-x:auto` を廃止。表幅100%・固定列レイアウト・セル折り返し・小さめの余白と文字を設定。9列×10行のデータは変更なし。
- `index.html` の表用JSキャッシュバスターを `?v=20261117e` に変更。関連自動テストの期待値を更新。
- 単独PR #21 `https://github.com/rapurasusann/db-specialist-study/pull/21` をsquashマージ（`9dfe2347a6edfd71568b84ce2277594f25752447`）。main読み戻しで表幅100%、横スクロール廃止、10行、下部ビューア非干渉を確認。
- 実ブラウザ/端末ごとの視覚受入とローカルNode一式は未実施。特に狭幅での文字の可読性は別途確認が必要。GitHub Actions不使用。

## 2026-11-17 問6表の改行禁止・横スクロール禁止（最新）

- 指示：問6の上部HTML表で横スクロールもセルの改行も不可。下部原本画像はそのまま。
- 表の各セルに`white-space:nowrap`、自然幅の表を表示領域に合わせて`transform:scale(...)`で縮小、画面幅変更時は`ResizeObserver`で再計算。横スクロールなし。
- 9列×10行の90セルは変更なし。下部原本ビューア・他問題・採点/履歴・Neon非干渉。
- 回帰試験に自然幅960px→表示幅320px（縮尺1/3、表示高さ120px）の模擬確認を追加。GitHubコード読み戻し・構文・シミュレーションPASS。実ブラウザとNode全件テストは未実施。
- 単独PR #22 `https://github.com/rapurasusann/db-specialist-study/pull/22` mainへsquash merge（`dc15465627f08da89a740f8fa20682947c495177`）。main読み戻しPASS。アセット版 `?v=20261117f`。
- **注意：スマホなどの狭い画面では、表全体の縮小により文字も小さくなる。** ブラウザ受入で可読性を確認する。

## 2026-11-17 問6表の左寄せ／右寄せ（最新）

- ユーザー要望：午前Ⅱ問6の上部HTML表は文字列を左寄せ、数値を右寄せ。
- 受注番号（列0）、単価・受注数・受注金額（列6〜8）を右寄せ。それ以外の顧客コード・顧客名・受注日・商品コード・商品名を左寄せ。ヘッダも同様。
- 改行・横スクロールなしの自動縮小、9列×10行、下部の原本PDF、採点・履歴は維持。
- 単独PR #23 https://github.com/rapurasusann/db-specialist-study/pull/23 mainへsquashマージ。コミット b4003c040af655ed950cec000c5901ad4f0b21de。
- V8模擬DOMで見出し・10行の計99セル配置を検証PASS。main読み戻しPASS。実ブラウザ外観とNode全テストは未実施。GitHub Actions未使用。アセット版 ?v=20261117g。

## 2026-11-17 ユーザーアカウント方式の決定（今回承認）

- **決定**：DB合格ノートのアカウント登録は「メールアドレス＋パスワード」。ユーザーID単位で学習履歴を記録し、複数デバイスで同期する。
- 初期対象：新規登録、メール確認、ログイン／ログアウト、パスワード再設定、アカウント削除、ユーザーID別の履歴保存と同期。
- 認証基盤：既存Neon Auth（Better Auth）のメール・パスワード認証を活用する方針。現時点ではメール・パスワード認証ON、自己登録OFF。自己登録を本番で有効にする前に隔離環境で検証する。
- セキュリティ：パスワードはアプリ側DBに平文保存しない。ユーザーIDはサーバーが検証した認証情報から確定し、クライアント指定を信用しない。RLSで本人の行のみSELECT/INSERT/UPDATEを許可し、他人・匿名アクセスを拒否する。ブラウザへDB接続文字列や秘密鍵を置かない。
- 既存履歴：端末内localStorageとJSONバックアップは維持。初回ログイン時の既存データ移行は明示的同意とバックアップ・競合確認後に実行。別アカウントへの自動転送を禁止。
- 既存工程の位置付け：CS-03＝認証／Data API方式・登録／メール確認／再設定の受入、CS-04＝ユーザー別RLS、CS-05＝認証済み同期、CS-06＝2端末競合・ログアウト／アカウント切替・データ移行・削除、CS-07＝UI・実機・公開受入。CS-01/02はCLOSEDのまま。
- **現状**：仕様決定のみ。認証画面・サインアップ・メール送信・Neon Data API・RLS・同期は未完成。PR #14はDraftのままmainへマージしない。Neon本番設定／本番学習データは変更しない。GitHub Actionsは使用しない。
- 次作業：CS-03の隔離Neonブランチでメール・パスワード登録の有効化条件、メール確認／再設定の実送信経路、セッションとJWT、Data API連携を検証。続いてRLSの本人・他人・匿名負試験。実装と公開は受入後。
