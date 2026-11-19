# 2026-11-19 午後Ⅰプレビュー・用語ツールチップ・回答保存の動作検証

## 対象
- 開発ブランチ `feat/cs03-server-progress-api-20261117`
- `src/pm-subquestion-view.mjs`, `src/pm-2025-verified-structure.mjs`
- `src/pm-subquestion-progress.mjs`, `src/glossary.js`
- 対応テスト `tests/pm-preview-dom.test.mjs`, `tests/pm-subquestion-progress.test.mjs`, `tests/glossary-first-occurrence.test.mjs`

## 今回実際に確認した内容
GitHubから最新のファイル内容を取得し、JavaScript実行環境でテストコードのロジックを展開して実行。**Node.jsの `node --test` コマンドや実ブラウザを実行した結果ではない**。

| 検証 | 結果 |
|---|---|
| 午後プレビューの簡易DOMテスト（大問5ページ切替、設問・図の自動/手動切替、未照合図の表示禁止、回答欄切替） | PASS（1件） |
| 設問別回答：従来の `written`、理解度、他の設問の回答を保存 | PASS |
| 設問別回答：編集・空欄への変更と他設問への非影響 | PASS |
| 設問別回答：不正なIDやデータ型を拒否 | PASS |
| ツールチップ：同一問題文の概念ごとに最初の1箇所だけ付与、2回目以降はテキスト | PASS |
| ツールチップ：別表記が同一概念なら重複しない、問題文の再描画時には新たに最初の1箇所へ付与 | PASS |

**合計：6テスト相当、PASS 6。** テストロジックをJavaScriptで実行した結果であり、Node test runnerの成功を意味しない。

## 追加で確認したこと
- テスト専用DOMでは、未完成の図1・図2・図3を表示せず、元の公式原本への誘導が残る。
- ツールチップの同じ用語の2回目以降について、DOMを無駄に書き換えて監視ループを発生させない。
- 原本内容の忠実性検証は未完了。図3のPK/FK下線も未完成のため、`verifiedStructure=false` が維持されている。

## 未完了・次に行うこと
1. 実際のNode.js環境で `npm run test:pm:structure`、`npm run test:pm:progress`、`npm run test:glossary` を実行。
2. 実ブラウザで操作・CSP・端末間の履歴影響を確認。ブラウザのテスト成功を推測で記録しない。
3. IPA公式原本と大問全文、図1～3の表記・下線・関係線を照合してから学習画面に統合する。
4. 公開版 `main`、既存の公式PDFビューア、既存の学習履歴は変更しない。GitHub Actionsは使用しない。
