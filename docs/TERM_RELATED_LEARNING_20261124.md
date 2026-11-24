# 単語学習の3点追加（2026-11-24）

## 変更
1. 単語理解：従来42問に、IMMEDIATE / DEFERRED / DEFERRABLE / SET CONSTRAINTS / INITIALLY IMMEDIATE / INITIALLY DEFERRED / UNIQUE制約 / トランザクション（COMMIT・ROLLBACK）を追加し**合計50問**。正答記録は既存の端末内記録 `db-study-terms-v1` を維持。
2. 学習サイトの過去問画面：`#currentTitle` の年度・科目・問番号を読み取り、登録済み用語のうち意味上の関連付けを設定したもの（2025午前Ⅱの問6/8/9/10/12/15/16/20/21/25）と、問題文に正確な表記で含まれる用語の学習リンクを表示。クリック先は**元のサイトの `?term=ID`、新規タブ、noopener noreferrer**。元の問題画面は保持。
3. 単語学習：回答前でも「回答・解説を表示」できる。解説だけの表示は学習履歴に正答を記録しない。通常の4択解答時だけ従来どおり記録。
4. `?term=con-deferred` 等で開くと対象のカテゴリと用語が自動的に表示される。

## 開発境界
- メール/パスワードによる端末間同期は引き続き未公開。Cloudflare/Neon等は変更しない。
- 既存の過去問本文・2025午後専用画面・CSP・学習履歴の既存キーは変更しない。
- GitHub専用ブランチ `feat/term-links-constraint-learning-20261124`。mainや公開サイトは未変更。
- 追加テスト `tests/term-related-learning-20261124.test.mjs`。開発PCで実行：`node --test tests/term-related-learning-20261124.test.mjs tests/term-understanding.test.mjs`。
- 画面統合テスト：午前Ⅱ問8からDEFERREDを新タブで開き、旧タブの問題番号・回答状態が維持されること。解説を先に表示しても単語の正答数が増えないこと。「この用語をもう一度」で選択を再開できること。戻って午前Ⅱ問6から正規形3用語へ移動できること。各分野が残り、制約・トランザクションが増えていること。
- 実ブラウザーでの動作・本番配備は未検証。開発PCによる確認まで公開は保留。
