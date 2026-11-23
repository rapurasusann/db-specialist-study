# CS-03 Neon隔離Function初回配置：実務引継ぎ（2026-11-23）

**現在の結論：** 配置のためのソース準備は可能。**Neon Function 0件・実クラウド配置/公開NO-GOを維持**。Cloudflare Workers Free、Zero Trust Free、未登録の支払い方法、Worker/DO 0件は運営者提出画面で確認済み。スクリーンショットの再提出は不要。ユーザーは細かな確認の繰り返しを避け、実際の端末間同期を優先する。

## 1. 今回新規の具体的な成果
- `scripts/cs03-stage-neon-function.mjs`：既存esbuildを使い、`functions/cs03-progress.mjs`から**Node24向け単一`index.mjs`**をWindowsのTemp配下に生成する。外部パッケージ`pg`・`jose`、`src/progress-api.js`・`src/progress-access.js`が入力に含まれるか検証し、ファイルのSHA-256と保存パスのみ表示。
- **Neon CLIやAPIのdeploy、env pull、Cloudflareへの接続を一切呼ばない**。秘密を埋め込まず、Functionの`CS03_ORIGIN_SECRET`・`CS03_TEST_DATABASE_URL`・`CS03_ISOLATED_BRANCH_ID`は実行時サーバー環境でのみ設定する。
- 以前の`tests/cs03-neon-function-offline-bundle.test.mjs`ではNode24形式のesbuild・import・秘密なし401を開発PCでPASS済み。ただし今回の**新スクリプトは未実行**。実行後に「ステージングのみ成功」と記録し、クラウド上の起動成功とは区別する。

## 2. Neon初回配置の固定対象と禁止事項
- 対象 project `quiet-mouse-39990305`、branch `br-snowy-truth-a162pmdt`（非default、ready）、Functionのslug候補 `cs03progress`（候補であり未作成）。Neonの正式`invocation_url`は配置成功後にプロバイダー応答から取得する。
- Neon APIの`deploy_function`は初回ZIPが必須、`nodejs24`指定、カスタムenvironment（文字列map）を受け入れる。ZIP内のトップレベルに`index.mjs`が必要。**この機能を呼び出すこと自体がクラウド書込み**なので今は呼ばない。
- **実秘密の取り扱いが承認前の決定事項**：この会話、GitHub、コマンド履歴、ログに接続文字列/共有秘密を記載しない。環境変数の保存・変更・失効方法、誰がどの権限で投入するか、設定後に秘密が表示されないことを事前に確定する。Neon `deploy_function`に秘密文字列を渡す場合、その値が操作先/呼出記録へ送信され得る点を評価するまで実行しない。
- 配置時、`CS03_ISOLATED_BRANCH_ID`、`NEON_BRANCH_ID`が指定された場合の一致、`CS03_TEST_DATABASE_URL`の最低権限DB `cs03_auth_sandbox` / role `cs03_progress_api` / `sslmode=verify-full`を必須。Neonの自動`DATABASE_URL`で代用しない。
- デプロイ前に実コードのpredeploy guardは独立して`TRUSTED_GATEWAY_NOT_IMPLEMENTED`等を返す**NO-GO**を維持。このスクリプトを成功させても承認ガードは解除しない。

## 3. 実行順と試験合格条件（後段は要個別承認）
1. **現在可能**：開発PCで新スクリプトを1回実行。Tempの`index.mjs`とSHA-256を確認する。機密情報をログに出さない。結果が正しければ配置候補を固定する。
2. **Neonの初回Function作成：独立承認必須**。対象branch・Function名・コードhash・料金/無料枠・秘密投入経路・事故時の停止/削除手順を確定し、承認後だけ配置。
3. **Neonを先に試すとき**：利用者データを書込まず、秘密なし/誤秘密→401、未知経路→404、正常なGateway secretでもBearerやOriginの不一致を拒否することを確認。実Functionを作成すると直URLが生じるため、絶対的な非公開ではない。
4. **Cloudflare Worker+DO+Access：さらに独立承認**。Certification-Study専用accountで、Access対象Worker全体・試験者1名の許可・Worker Free上限時Fail closed・DO停止時503を設計どおり確認してから外部入口へ接続。単なる`request.cf`はIngress検証ではない。
5. **初回実同期**：PCで1件保存→別端末で同じアカウントにログインし、同じ進捗が反映されることを確認。通信の失敗は成功として扱わず、未送信下書きが失われないことを確認。公開プレビュー/CSP/mainは別承認。

## 4. 停止と切戻し
想定外の認証成功、別アカウント/branchへの接続、予想外の課金・過剰なinvocations、秘密の漏えいを確認したら試験停止。Cloudflareの外部入口を閉じ、Neon Function直URLの失効/無効化も別に行う。Neon Functionの`delete_function`は分離branchの対象slugだけ指定可能だが**破壊的操作**なので個別承認なしに実行しない。DB・Auth・他プロジェクト/本番branchの削除は対象外。Freeプランや支払い方法未登録は費用ゼロの永続保証ではない。

## 5. 次の1手
開発PCで`node scripts/cs03-stage-neon-function.mjs`を実行し、`CS03_NEON_STAGE_ONLY=YES`を確認する。これは安全な**ローカル成果物作成のみ**。その成功後、Neon Functions**初回配置の対象範囲と安全なsecret投入方式**をまとめた承認段階に進む。公開は引き続き**NO-GO**。
