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


## 2026-11-23 最新の合格結果・残課題（追記）

**判定：NO-GOのまま。** 既存の「ブラウザ→公開HTTPS API→Neon DB未実施」は現在も正しいが、下記のローカル模擬通信と隔離DBへの直接実アクセスは別々に合格済みとなった。

| 確認対象 | 判定 | 根拠・制約 |
|---|---|---|
| 隔離DB cs03_auth_sandbox へのAPI専用ロール接続 | PASS | 開発PCで認証と権限を確認。接続文字列は非公開 |
| 隔離DBの一時INSERT/SELECT/UPDATEとアカウントA/BのRLS分離 | PASS | CS03_LIVE_ACCEPTANCE_PASS、ROLLBACK送信と対象テスト行不在を確認。Git 8908524 |
| ブラウザ用クライアント→Worker候補→DO→Neon Functionアダプタ | **ローカル模擬PASS** | tests/cs03-worker-entrypoint-full-chain.test.mjs 4/4 PASS、Git fb9b8fb。Worker、DO、上流ストアは実クラウドではない |
| 隔離Neon Functionsのクラウド配置 | **未実施** | Neon APIで隔離ブランチ br-snowy-truth-a162pmdt のFunction一覧を再確認、**0件** |
| Cloudflareの実経路・Worker・DO配置、fail-closed実測 | **未実施** | 本番ルート/公開URLを作成せず、プレビュー無効を維持 |
| アカウント全体のFree枠消費と課金設定、既存サービスとの共用量 | **未確定** | 過去のダッシュボード観測は一時点のみ。実配置前に再確認 |
| 実際のブラウザHTTPS→Cloudflare→隔離Neon Function→DB | **未実施** | Function 0件、隔離Workerルート未配置につき検証不可 |
| 保存失敗時の再読込を越えた復旧・バックアップ取込み | **未完了** | JSON退避と模擬試験は実施済みだが安全な復元処理は未合格 |

### 次に閉じるべき工程（承認前作業と実クラウド作業を分離）
1. **ソース・構成の承認前整理：** WorkerアダプタとNeon FunctionのURL/認証設定の整合、秘密管理、固定接続先、Cloudflareで実際に保証できる接続元情報を評価。request.cf だけを本物のCloudflare経路だとみなさない。テスト鍵・機密情報は設定ファイルに含めない。
2. **無料運用条件の審査：** Cloudflare FreeとNeon Freeの当該アカウントの現在の利用量、Worker/DO共用枠、失敗時の閉鎖、警告と停止・切戻し手順を実証する。一般的な無料枠数値だけでゼロ追加料金を保証しない。
3. **学習データ復旧：** 再読込時の未保存データ保持、バックアップからの安全な取込み、競合時に古いデータで上書きしない処理を完了する。
4. **実クラウドの隔離検証：** 上記の安全条件を満たしたあと、**別途明示的に承認された場合に限り**、隔離Function/Workerの配置と本物のHTTPS経路の正負テストを実施。課金契約・本番切替を含めない。
5. **公開判定：** 実クラウド証跡と運用上限の受入、公開用CSP/CORSの確認、独立承認が揃うまでNO-GOを維持する。

この追記は実クラウドの検証済み証明でもリリース承認でもない。既存のデプロイ停止ガードと公開ページのプレビューOFFは維持する。合格済みテストは、関連コードや設定が変更されない限り再実行しない。
