# 学習品質改善 最終照合記録（2026-11-25）

> 2021年度の第三者コピーによる照合は当時の記録。11/26のユーザー提供公式PDFによる正答照合は [現行状態](CURRENT_STATUS.md) と [出典台帳](../data/am2-archive-sources-2016-2024.json) を参照。L工程の合格範囲を新コードに転用しない。


> 当時の工程・結果の記録。最新判断・後続変更は [CURRENT_STATUS.md](CURRENT_STATUS.md) を参照。
公式資料：https://www.ipa.go.jp/shiken/syllabus/nq6ept00000014bm-att/syllabus_db_ver4_1.pdf （本文8ページを確認）。各小項目の最低1教材の対応であり、細目全体の習得や合格を保証しない。

|小項目|要旨|教材ID|
|---|---|---|
|1-1|全社計画|lq-enterprise-plan|
|1-2|標準化|lq-data-standard|
|2-1|現状分析|lq-current-analysis|
|2-2|範囲|lq-scope|
|2-3|要件|lq-nfr|
|3-1|概念モデル|2025:am2:2|
|3-2|概念モデル検証|lq-model-validation|
|3-3|論理モデル|2025:am2:4|
|3-4|論理モデル検証|lq-model-validation|
|4-1|製品選定|lq-dbms-choice|
|4-2|物理設計|2025:am2:13|
|4-3|実装|lq-least-privilege|
|4-4|試験・移行|lq-reconcile|
|5-1|運用計画|lq-rpo|
|5-2|運用保守|lq-monitor|
|5-3|管理|lq-db-audit|
|5-4|性能改善|lq-execution-plan|
|5-5|利用支援|lq-user-support|

## 判定
- L-01 CLOSED: 18/18 ID存在確認。既存50問＋追加20問。追加終了。
- L-02 OPEN: 2016–2024各25問、2025解説・正解25問確認済み。公式解答との全件照合未実施。
- L-03 OPEN: 用語理解70問の構造確認済み。用語集への反映未確認。
- L-04 CLOSED: 前回のソース確認に基づく既存Lv1–5教材条件達成。実機はL-09。
- L-05 OPEN: 全解説の技術的正確性の確認未完了。
- L-06～08: 抽出ロジック11件合格。ブラウザ統合未確認。
- L-09 OPEN: PC/スマホ実機未確認。
- L-10 OPEN: 最終差分・公開判断未完了。
既存試験の反復や件数目的の追加は不要。main・本番・CS-03変更なし。

## 公式正解の照合追記
2026-11-25、IPA公式PDFの正解表をテキスト・ページ画像で確認し、登録JSONの問番号ごとに比較。
- 2016: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000gn5o-att/2016h28h_db_am2_ans.pdf
- 2017: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fzx1-att/2017h29h_db_am2_ans.pdf
- 2018: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000fabr-att/2018h30h_db_am2_ans.pdf
- 2019: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000ddiw-att/2019h31h_db_am2_ans.pdf
- 2020: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt8000000d05l-att/2020r02o_db_am2_ans.pdf
- 2022: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/gmcbt80000008smf-att/2022r04a_db_am2_ans.pdf
- 2023: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_db_am2_ans.pdf
- 2024: 25/25 一致、差異 なし。https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_db_am2_ans.pdf
- 2021: PDFの日本語文字がテキスト・画像とも表示されず未照合。2025: 今回は公式PDF未取得。全件照合済みとは扱わない。
- L-02: 未照合年度を明記。問題文・図・解説の意味の完全照合とは別。

## 残り2年度の照合（2026-11-25）
- 2025: IPA公式PDFの表・画像を確認し index.html の正解配列と25/25一致。https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_db_am2_ans.pdf
- 2021: IPA公式URLの画像・テキストは文字欠落。第三者掲載のIPA解答表コピー https://shiza-lab.com/wp-content/uploads/2025/07/db-2021-1-am2-ans.pdf の抽出テキストとJSONを比較し25/25一致。公式サイト原本との直接比較は未確認。
- 累計250/250一致（うち2021は第三者掲載資料による）。L-02の正解照合・データ欠損確認終了。全問題文・図・解説の意味の完全照合は保証しない。L-05は別途。
- L-03: 用語集197語（既存177語維持・20語追加）、用語理解70問。データ評価完了。ブラウザ統合はL-09。

## 終了判定（遠隔作業）
- L-06〜08: 抽出した実装ロジック17/17合格（重複、習得状態、各出題モード、優先順、0件、率の算出を含む）。ロジック条件達成。実ブラウザ統合はL-09に集約。
- L-05: 2025問9の説明を修正済み。全250問の解説登録確認済みだが全説明の意味の独立検証は未完了。網羅的な正確性は宣言しない。
- L-09: 実ブラウザ・スマホ未実施。
- L-10: 基準コミットとの差分は docs/LEARNING_QUALITY_ACCEPTANCE_20261125.md、docs/LEARNING_QUALITY_RESULT_20261125.md、src/am2-2025-explanations.js、src/glossary-terms.js、src/learning-coverage-ui.js、src/term-understanding-questions.js。同期機能・クラウド設定の変更なし。本番未反映。
- 進捗：L-01〜04およびL-06〜08の7/10を条件達成（既記載の資料制約あり）。残りL-05、09、10。既存試験の反復は禁止。追加教材は20問で固定。
