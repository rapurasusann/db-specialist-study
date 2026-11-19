# 午後Ⅰ・問1：回答保存・再保存 JavaScript実行検証（2026-11-19）

## 対象
- ブランチ: `feat/pm1-q1-figure2-transcription-stage1-20261119`
- 対象ソース: `src/pm-subquestion-view.mjs`, `src/pm-2025-verified-structure.mjs`
- 検証方法: GitHubから取得した両ファイルの実装をJavaScript実行環境で評価し、簡易DOMを構築してUIイベントを直接起動した。Node.js標準のtest runner / Chromium / Playwrightは使用していない。
- 既存テスト `tests/pm-structured-view.test.mjs` の旧 `saveAnswer(selected,answer.value)` 期待値は前コミット `1454e6c` で更新済み。

## 実際に実行した7ケース
| # | ケース | 結果 |
|---|---|---|
| 1 | 保存済み回答の初期読み込み | PASS |
| 2 | 保存失敗時の警告表示 | PASS |
| 3 | 設問2に切り替えた場合の回答分離 | PASS |
| 4 | 未保存の設問1へ戻って回答と再保存操作が残っている | PASS |
| 5 | 保存先の復旧後、再保存で警告が消える | PASS |
| 6 | 保存先に渡る設問IDと回答が正しい（2回の試行） | PASS |
| 7 | 図2が未検証の間は非表示・全体データ構造は有効 | PASS |

実行合計: 7 PASS / 0 FAIL。

## 制約・留保
- この検証は、取得した実コードの関数を評価したもので、モック表示環境を使用している。ブラウザ固有のレイアウト、DOM API全体、保存ストレージの永続性は未検証。
- GitHub Actionsは実行していない。
- 開発ブランチの図2は `verifiedStructure:false` 等の未完成ガードを維持。原本の複合キー80候補、残りの下線、本文逐語照合は未完了。
- main、公開版、既存の学習履歴には変更を加えない。

## 次
ローカルNode.jsが使用できる開発環境で `node --test tests/pm-structured-view.test.mjs tests/pm-preview-dom.test.mjs` を実行し、既存テストを通す。実ブラウザ試験は別工程とする。
