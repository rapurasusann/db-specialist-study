# 午後Ⅰ・問1 図2の直接表示防止検証（2026-11-19）

## 問題と対応
- 既存 `src/pm-preview-entry.mjs` は `validatePmStructure` を実行してから描画するが、共通部品 `createPmSubquestionView` を別の入口から直接利用した場合、図2の `verifiedStructure` だけで表の描画を許可していた。
- `src/pm-subquestion-view.mjs` に図2専用の追加ガードを設け、`sourceTranscriptionVerified`、`keyNotationVerified`、未解決の `primaryKeyCandidates`、`UNVERIFIED` の有無を確認する。
- 条件未達なら図2を表示せず、IPA原本へのリンクと未整備の注意文を維持する。既存の一般的な図表表示ロジックや回答保存処理は変更しない。

## 実行した検証
- `tests/pm-preview-dom.test.mjs` に、図2の `verifiedStructure=true` だけを書き換えて手動選択しても表が表示されないテストを追加。
- `sourceTranscriptionVerified=true` および `keyNotationVerified=true` だけを書き換えた場合も、未解決の複合キーがあれば表が表示されないことを検証。
- 既存のページ・設問切替と再保存を含む計6件のテスト本文を、GitHubの最新ソースを用いてV8の簡易DOM環境で実行。結果 **6 PASS / 0 FAIL**。
- `node --test` の正式実行と実ブラウザでの表示・アクセシビリティ試験は未実施。

## 公開の扱い
この変更は独立した開発ブランチのみ。図2は未完成のため非表示を維持し、公開版／既存学習履歴への変更なし。
