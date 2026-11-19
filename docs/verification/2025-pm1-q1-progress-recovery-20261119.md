# 午後Ⅰ・問1：設問回答の保存・復元と異常データ保護（2026-11-19）

## 変更内容
- `src/pm-preview-entry.mjs` の書込み処理で、問題レコードが存在しないときは新規作成するが、存在する値が `null` など不正な場合は空の値として上書きせず、`updateSubquestionAnswer` の入力検査で拒否するよう修正。
- 以前の `progress[recordId]??{}` は不正な既存 `null` を「レコードなし」と区別できず、他の学習項目を消す恐れがあった。これを `Object.hasOwn(progress,recordId)?progress[recordId]:{}` に変更。
- 新規テスト `tests/pm-preview-storage.test.mjs` を追加。プレビュー初期化と入力イベントを簡易DOMおよび模擬 `localStorage` で操作する。

## 実行した検証（V8による実装・テスト本文の再実行）
1. 既存問題レコードが null のとき上書きせず失敗を通知：PASS
2. 正常保存で大問回答、学習レベル、別設問の回答、別問題の記録を保持：PASS
3. 保存後のプレビュー再初期化で回答を復元：PASS
4. 不正なJSONの保存領域を上書きせず失敗を通知：PASS
5. 配列型の既存問題レコードを上書きせず失敗を通知：PASS

**5 PASS / 0 FAIL**。GitHubから取得した最新実装コードをV8で動作させ、テスト本文の動作を検証。Node.jsの `node --test` ランナーおよび実ブラウザ試験は未実施であり、同等の環境でPASSしたとは主張しない。

## 公開への影響
- 変更先は独立した作業ブランチのみ。main、公開画面、本番保存データは未変更。
- 図2の原本照合が未完了のため、午後Ⅰ・問1の公開判定は引き続きNO-GO。

## 次に行うこと
- 開発PC上で `node --test tests/pm-preview-storage.test.mjs tests/pm-preview-dom.test.mjs tests/pm-structured-view.test.mjs` を実行。
- ブラウザで保存成功・保存失敗・再初期化時の復元を検証。
