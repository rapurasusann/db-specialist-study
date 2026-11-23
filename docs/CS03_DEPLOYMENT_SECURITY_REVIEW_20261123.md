# CS-03 クラウド同期・隔離デプロイ判定（2026-11-23）
判定：**NO-GO（配置禁止）**。この文書は承認票ではなく、読み取りによる事実確認記録。

## 現在の確認結果
- 既存の実Neon Auth・DB直接接続による隔離試験は過去にPASS（2026-11-19、`docs/CS03_PROGRESS_API_20261117.md`）。一方、最新のブラウザ→公開HTTPS API→Neon DBの接続試験は未実施。
- Neon `certification-study` / 非defaultブランチ `br-snowy-truth-a162pmdt`（2026-11-23時点 Ready）に登録済みNeon Functionsは0件。
- `functions/cs03-progress.mjs` は `x-secret` を要求する。`src/cs03-account-client.mjs` はJWTを送るが `x-secret` は送らない。この秘密をブラウザに入れてはならない。
- GitHub Pagesの本番プレビューは既定OFF。CSPは `connect-src 'self'` で外部API通信を禁止。現行CSPを単に緩めても安全な接続経路は完成しない。

## 未完了ゲート
1. **信頼できる中継サービス**: ブラウザJWTを中継し、サーバー側でのみ秘密を追加する仕組み。中継自体が適切な認証、オリジン検査、サイズ制限をすること。
2. **濫用・費用制限**: 未認証・不正署名・過剰アクセスをDB接続より前で遮断し、全体／IP／本人別レート制限、リクエストサイズ上限、観測と停止手順、無料枠上限を合意すること。CORSと`Origin`判定だけでは呼び出し回数を制限できない。
3. **API到達とCORS整合**: `/progress` のルーティング、Browser→Gateway→隔離Functionの正常・拒否系。ローカル試験のOriginと公開ページのOriginを混同しない。
4. **アカウント保存の復旧**: 失敗時のJSON退避は実装・模擬ブラウザPASS。ただしバックアップからの安全な復元、ページ再読込時の未保存データ保護は未完。
5. **独立した承認**: 追加費用の見込みがなく、隔離以外へ設定が漏れないことを確認してから、配置・実通信・新規テストユーザー作成の個別実施判断を行う。

## 禁止事項
- 本番`main`、production DB、公開版設定の変更禁止
- セキュリティ用秘密やDB接続文字列をJavaScript、GitHub、ログへ置かない
- ネイティブNeon Function URLをブラウザから直接使わない
- 追加料金契約、Neon Functions配置、GitHub Actionsをこのチェックだけで開始しない

判定を再確認するコマンド：`node scripts/cs03-predeploy-guard.mjs --report`（読取専用・停止条件を出力）。
`npm run check:cs03-deploy` はNO-GO中に失敗するのが正常。ゲートが揃ってもデプロイ実行を自動許可しない。
