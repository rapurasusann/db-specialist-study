# 午後Ⅰ 問1 — 設問文の原本照合状態と警告表示（2026-11-19）

## 対応した問題
未完成の大問 `status:'PARTIAL_SOURCE_VERIFICATION'` で、個別の設問だけ `textStatus:'VERIFIED_TRANSCRIPTION'` とされた場合、設問文の要約警告が消える余地があった。設問が一部だけ確認されていても、大問全体が未完成なら、正式な原文と誤認させない。

## 修正
- `src/pm-subquestion-view.mjs` の警告表示条件を変更。
- 大問が `FULL_SOURCE_VERIFICATION`、設問が `VERIFIED_TRANSCRIPTION`、問題文が空でない、の3条件を同時に満たした場合のみ要約警告を解除。
- `tests/pm-preview-dom.test.mjs` に、個別設問フラグを変更しても大問未完成なら警告を維持するテストを追加。設問切替後の警告と、全条件が揃った場合の表示も確認する。
- 問題文テキスト・図表の照合済み扱いを増やさない。図2の未完成ガードも維持。

## 実行記録
GitHubの現行作業ブランチから実装・テスト本文を取得し、V8の簡易DOM環境で全7件を再実行した。**7 PASS / 0 FAIL**。
これはNode.js `node --test`、Chromium等の実ブラウザ試験のPASSを意味しない。

## 公開への影響
独立した開発ブランチ内の変更のみ。main、本番の学習履歴、公開サイトに変更なし。午後Ⅰ・問1の原本照合完了／公開判定は依然NO-GO。
