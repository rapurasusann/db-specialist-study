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

## 6. 開発PCでの配置候補生成結果（2026-11-23）

開発PCで HEAD `7b89e7edcfc3f7ec3cb7a84302de666e202d4675` を確認後、`node scripts/cs03-stage-neon-function.mjs` を実行。ユーザー提出ログより `CS03_NEON_STAGE_ONLY=YES`、`CS03_NEON_DEPLOYMENT_APPROVED=NO`、`CS03_NEON_SECRET_EMBEDDED=NO_RUNTIME_ENV_REQUIRED`、`CS03_NEON_RELEASE=NO-GO` を確認した。

ローカル生成物：`C:\\Users\\kouki\\AppData\\Local\\Temp\\cs03-function-candidate-L3zQgb\\index.mjs`。SHA-256：`ada949602f4c8673ac0118a526616b3cacd8f13e400c9865908485b458906619`。パスは開発PCの一時ファイルであり、GitHub/Neonへの成果物アップロードは**未実施**。出力フラグはスクリプトの設計意図・環境変数注入待ちを表し、生成バイナリに秘密が絶対に存在しないことの独立監査ではない。CLIの終了は正常で、関係依存・サイズチェックを通過している。

**次の判断**：Neon隔離Functionの実配備を希望する場合、対象branch・コードSHA・上限・秘密の投入方法（コンソールや履歴に平文を残さない）・緊急停止方法を確認し、実作成操作だけを明示承認する。Cloudflare Worker/DO配備や公開を同時に認可しない。実クラウド配置はNO-GO維持。

## 7. 初回配備時の秘密・停止方式を確定（2026-11-23）

Neon公式 `https://neon.com/docs/compute/functions/deploy` と `https://neon.com/docs/compute/functions/environment-variables`、接続ツールの実インターフェースを確認した。**初回配置にはZIP bundleが必須**、ランタイムは`nodejs24`、環境変数はデプロイに紐付く。以後はAPIの`environment`だけの更新が可能。個別Function削除操作も`project_id`・`branch_id`・`slug`を全て指定して行えるが、削除は破壊的であり別途承認が必要。

**秘密の取り扱い：** このチャットのNeon管理ツール`deploy_function`は環境変数のJSON文字列を引数に受けるため、実DBパスワード・共有秘密をチャット／ツール呼出し引数に含めることになる。**本案件ではこの経路で実秘密を渡さない**。Neon CLIの`--env KEY=VALUE`もコマンド履歴/プロセス引数に露出するおそれがあるため秘密投入には使わない。安全な手段は**開発PC側でログ・履歴・Git管理外で秘密値を扱う、Neon公式APIへのTLS接続処理**（API認証キー/秘密をチャットへ送らない、変数の値をログしない、エラー時には値をマスクする、使用後にメモリ/一時ファイルを最小限にする）を検討し、運用者が具体的に承認した後のみ実施。Neonコンソール上の秘密入力欄が存在するなら、それを直接使えるか別途確認。**単に値をChatGPTに送って登録してもらう方法は採用しない**。

**最小の2段階作成方針（まだ未実施）**：
1. **隔離Functionのコードのみ初回配置**：隔離project`quiet-mouse-39990305`・非default branch`br-snowy-truth-a162pmdt`・slug候補`cs03progress`・Node24・検証済みSHA256`ada949602f4c8673ac0118a526616b3cacd8f13e400c9865908485b458906619`のソースをZIPに入れて作成。**`CS03_ORIGIN_SECRET`などの秘密をまだ登録しない**。現在のFunction実装はOriginが正しい`/`又は`/progress`へのリクエストでもsecret欠落なら401（DB runtime生成前）。これにより最初から認証済みの実リクエストを処理できない状態で起動できる。ただしインターネットから呼出URLにアクセス可能になり、リクエスト数の消費やDoS面が増える。**初回作成操作にも明示承認が必要**。
2. **secret付きの最小実接続**：Cloudflare側の認証済み・Accessで保護された入口とDO quotaの実設定が完了し、下流への通信遮断策がある状態になってから、**開発PCの秘密を秘匿した手段による環境変数の追加デプロイを別承認**で行う。Neonは自動注入`DATABASE_URL`を使わず、専用DBロールの`CS03_TEST_DATABASE_URL`を指定。Function直URLは共有秘密とJWTで常時保護する。

**停止・失効の具体手順**：
- 機能停止の第一手：Cloudflare Access/Workerの当該試験経路を閉じる（クラウド間通信・本番プレビューを停止）。**Neonの直URLは残る**ため、これだけを停止完了としない。
- Neon側：`cs03progress`の**server secretを無効化**（APIで既存Functionの環境変数を空値/除去する構成更新を検証）または**Functionそのものを削除**。後者はAPI/接続ツール`delete_function`が使えるが**別途、対象を明示して承認**を得る。Neon側の状態・公開URL 401/404・invocations、Cloudflareへの影響を確認して停止完了。既存DB/Auth/branch、他アプリは削除しない。
- エラーや異常時に`fail open`へ切り替える、秘密検証を外す、別DBに迂回する、支払方法を登録するなどの回避は絶対しない。

**未完了の証拠**：開発PCで生成した`index.mjs`はユーザーPCのTempにあり、こちらのツールはそのファイルの実バイトを取得していない。**ログに示されたSHAと実際に配備するZIPの一致・署名なし成果物の真正性は配置直前に照合する必要がある**。秘密の開発PC側への安全投入・Function API権限、初回デプロイ費用・実プラン上限と直接公開URLの扱い、緊急停止/削除操作の権限を確認するまでは**実配置NO-GO**。

**次の決定**：この2段階のうち、**秘密なし・DBに接続できない初回Functionを隔離branchに作成することだけ**を、利用量・直URLの発生・停止方法・成果物一致の確認後に運営者へ明示して承認確認する。承認してもCloudflare Worker/DOの作成、秘密登録、公開、本番main操作の承認にはならない。

## 8. 初回Function作成のユーザー承認・再確認（2026-11-23）

ユーザーは**Neonプロジェクト `quiet-mouse-39990305`／隔離branch `br-snowy-truth-a162pmdt`／slug `cs03progress` に、秘密情報を一切登録せずFunction 1件を作成すること**を明示承認。Cloudflare Worker/DO、Access Policy、secret投入、公開プレビュー/CSP、GitHub Actions、課金・支払い方法変更、main統合は未承認。今回の権限は既存の本番`default`ブランチや他プロジェクトへ拡張しない。

**承認後の読み取り再確認**：Neon接続の `list_organizations`で **Certification-Study plan=free**、`list_projects`で対象projectとSingapore、`get_branch`で対象branch`ready/default:false`、`list_functions`で0件を確認（2026-11-23）。利用枠の残数は計測していないため超過請求ゼロを断定しない。

**この場での配置について**：対象コード`index.mjs`の生成は操作者開発PCで完了し、SHA256 `ada949602f4c8673ac0118a526616b3cacd8f13e400c9865908485b458906619` がログにある。ChatGPTのNeon`deploy_function`ツールは初回のコードZIP base64が必須であり、開発PCのファイル内容に直接アクセスできない。元コードを別途再ビルドして異なる成果物を無断配置することはしない。

**実行方式（承認済みスコープのみ）**：Neon公式CLIの`neon login --keyring`で開発PCのブラウザ認証、`neon functions deploy cs03progress --src <validated index.mjs> --no-bundle --runtime nodejs24 --branch br-snowy-truth-a162pmdt --project-id quiet-mouse-39990305 --wait`。**`--env`なし**。実行直前にファイルハッシュが上記一致し、同名Functionが無いことを読み取りで確かめる。ログにsecretやAPIキーを貼り付けない。CLI実行が失敗したら再試行・別branchへの変更・秘密登録を自動で行わず停止。Function生成時に公衆から到達可能なURLが発生し、secret未設定でもリクエスト枠消費はあり得る点を留意。

**現時点の事実**：Neon Functionは作成コマンド実行前で**まだ0件**。上記は実行指示の記録であって、デプロイ成功を意味しない。完了後に`list_functions`/`get_function`を読み取ってstatusを確認。Functionの共有secret欠落はHTTP 401となり、ユーザーデータ処理は実施しない。
