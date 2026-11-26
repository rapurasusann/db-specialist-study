# 資格勉強アプリ — 全資料インデックス

最初に [現行状態](CURRENT_STATUS.md) を読む。各資料の責務を以下に固定する。現行判断は履歴より優先するが、ユーザー承認・安全条件を上書きしない。

| 資料 | 分類・用途 |
|---|---|
| [README](../README.md) | 入口 |
| [現行状態](CURRENT_STATUS.md) | 全体判定・進捗・再開入口 |
| [現行学習機能仕様](LEARNING_FEATURE_SPEC.md) | 学習機能の仕様・実装照合 |
| [午前Ⅱ図表契約](AM2_FIGURE_RENDERING_CONTRACT_20261126.md) | 隔離候補の現行受入・残課題 |
| [午前Ⅱ原文工程](AM2_ORIGINAL_SOURCE_PLAN_20261125.md) | 工程ID・原文維持方針。進捗は旧時点 |
| [出典台帳](../data/am2-archive-sources-2016-2024.json) | 公式URL・正答確認記録 |
| [学習品質受入](LEARNING_QUALITY_ACCEPTANCE_20261125.md) | 固定10工程の条件 |
| [学習品質結果](LEARNING_QUALITY_RESULT_20261125.md) | 過去の証拠・判定 |
| [2024原本監査](AM2_2024_VISUAL_AUDIT_20261125.md) | 過去の照合記録。証拠不足は現行契約に従う |
| [2016–2024追加](AM2_ARCHIVE_2016_2024_20261124.md) | 初期導入履歴 |
| [25問引継ぎ](AM2_25_CHALLENGE_HANDOFF_20261125.md) | 初期仕様・変更履歴 |
| [午前Ⅱ解説](AM2_ANSWER_EXPLANATIONS.md) | 通常画面の解説・選択リセット設計 |
| [シャッフル・図表](AM2_SHUFFLE_FIGURES.md) | 旧図表方式と選択肢設計 |
| [用語ツールチップ](GLOSSARY_TOOLTIPS.md) | 用語追加・操作設計 |
| [関連用語学習](TERM_RELATED_LEARNING_20261124.md) | 初期導入履歴 |
| [午後試験転記](PM_2025_TRANSCRIPTION.md) | 転記履歴。追加作業対象外 |
| [セキュリティ](../SECURITY.md) | 公開側セキュリティ方針 |
| [本整理の点検記録](DOCUMENT_AUDIT_20261126.md) | 整理範囲・検証・保留 |

## 独立した開発系統
- [CS-03索引](https://github.com/rapurasusann/db-specialist-study/blob/feat/cs03-cross-browser-sync-20261123/docs/CS03_INDEX.md)
- [CS-03現行引継ぎ](https://github.com/rapurasusann/db-specialist-study/blob/feat/cs03-cross-browser-sync-20261123/docs/CS03_HANDOFF_20261125.md)
- [CS-03実行契約](https://github.com/rapurasusann/db-specialist-study/blob/feat/cs03-cross-browser-sync-20261123/docs/CS03_DARK_DEPLOY_EXECUTION_20261125.md)

CS-03の承認・安全条件は同ブランチの正本が優先。通常教材側と同期側の進捗・試験を合算しない。

## 更新方法
新規資料の責務を決め、既存正本に統合できる場合は追加しない。変更時は索引・現行状態・根拠の参照先を同時に更新する。200行または20 KiBは見直し目安。長い履歴は固定コミットへのリンクで残し、内容を重複転載しない。受入証拠には対象コミット・対象範囲・実行結果・未実施範囲を明示する。
