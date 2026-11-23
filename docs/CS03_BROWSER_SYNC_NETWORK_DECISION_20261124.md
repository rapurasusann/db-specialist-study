# CS-03 実ブラウザー同期向け通信経路の選択（2026-11-24／未承認・NO-GO）

## 結論
**現行GitHub Pagesの資格勉強アプリから、Accessで保護された別オリジンのWorkerをそのまま呼ぶ案は成立していない。** 今後のCloudflareの初回作成前に経路を決める。一般公開・有料契約は行わない。

## 実装から確認できる事実
1. `src/cs03-account-client.mjs` は `fetch`で `credentials:'omit'`、`Authorization: Bearer <Neon Auth JWT>` を送る。Cookieを送りたくない方針が既存テストで確認されている。
2. `server/cs03-trusted-edge-gateway.mjs` は固定`Origin`、JWT署名/issuer/audience、DOの共有Quota、上流Neonへの非公開shared secret、異常時503/429を持つ試験候補。Neon側は隔離Functionを配備済みで、共有secretが無いGETは401（実HTTP合格済み）。
3. `server/cs03-gateway-production-adapter.mjs` は2026-11-24の安全強化後、`ctx.access.aud`（Cloudflare Accessによる認証済みコンテキスト）と`CS03_ACCESS_AUD`が一致しない限り503を返す。これは**運営者専用の限定試験に向く**が、利用者向けAPIでAccessを必須にするならブラウザーのCookie問題の解決が必須。

## 公式仕様に基づく衝突
- Cloudflare Accessは通常`CF_Authorization` cookieでセッションを判定。異なるオリジンの`OPTIONS` preflightにはCookieがつかず、Access側で拒否される場合がある。`OPTIONS`をAccess上でバイパスする方法はあるが、その場合`ctx.access`も認証済みにならないため今のWorkerアダプターは503。単純なCORS許可では解決しない。出典：https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/
- ブラウザーfetchの`credentials:'omit'`はCookieを送らない。出典：https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
- WorkersがStatic Assets Router経由なら`ctx.access`は内部Workerに渡らない場合がある。またService Binding経由の下流にも伝播しない。出典：https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- GitHub PagesからのAPIリクエストに`Authorization`ヘッダーを付けるためCORS preflightが発生する。サービスTokenをJSに埋め込む解決は禁止。

## 選択肢
| 案 | 手段 | 端末間同期まで | 新たなリスク/変更 |
|---|---|---|---|
| A. **推奨候補：ブラウザーAPI用のJWT/DOゲートを限定的に分離** | Accessを運営者向け隔離検査に限定。ブラウザーが呼ぶWorkers APIは`credentials:'omit'`とNeon JWTに対応し、Origin+CORS+署名検証+原子的DO quota+上流secretを必須とする**別の認可入口** | GitHub Pagesの変更を最小にしてPC→別端末の同期に進みやすい | URL自体は公開到達可能になり、未認証BotリクエストでもWorkersのFree日次リクエスト枠を消費する。プラン/上限時fail-closed/予想外使用量/停止を実検証、独立承認が必要 |
| B. Access保護した同一オリジンの別プレビューサイト | Cloudflare上に試験用フロントとAPIを同一サイトとして置き、Access Cookieを同一オリジンで送信。必要なら`credentials:'same-origin'`に切替 | 限定ユーザーで認証UIのブラウザーテストが可能 | 別サイトホスティング・CSP・cookie/SameSite・Static Assets Routerによる`ctx.access`非伝播・セッション共有の設計が増える。GitHub Pages本番を改変しないこと。将来一般公開の経路とは別の検証が必要 |
| C. 既存の別オリジンAccess WorkerをCookie付きで呼ぶ | AccessのCORS設定、preflight処理、`credentials:'include'`等を採用 | 現行設計のままでは不可 | Third-party Cookie制限・CSRF・異なるアクセスコンテキストの扱い等の難題があり、これだけを採用するのは推奨しない |

## 次の安全な開発作業（Cloudflare初回作成前）
1. **A案を第一候補に**、ブラウザーAPI専用の安全な入口と運営者専用Access入口の役割を明確に分離し、誤設定で認証が解除されないことをオフライン試験可能な形にする。共有JWT検証/DO quota/Neon upstream secretは省略しない。Accessの`ctx.access`ゲートは運営者専用に残す。
2. Workers Freeの上限時の停止動作を経路単位で確認。Cloudflareアカウント・Workerルート・プレビュー URL のアクセス対象を一元管理し、既存GitHub PagesのCSP/公開は別承認に分ける。
3. 攻撃者がアクセスURLへ直接リクエストできることを前提としたコストの検証方法と停止手順を設定。運営者が承認するまで**ブラウザー向けHTTP入口を公開しない**。
4. ローカルリポジトリなしPCではGitHub上の実装・テストコード・仕様の改善を進めるが、未実行テストをPASS扱いしない。2026-11-24のRemote限定作業に組み入れた。

**最短経路の候補はA**。Accessは最初からすべてのユーザーのログイン認証として使うのではなく、運営者限定のCloudflare隔離試験で使う。ユーザーの資格勉強アカウントの認証はNeon Auth JWTを使う。この構成選択・クラウド作成・公開は**まだ承認されていない**。

## 2026-11-24 01:00 リモート実装：JWTブラウザー入口の隔離候補

- `server/cs03-browser-jwt-entrypoint.mjs`を新規追加。既存の運営者向け`cs03-gateway-production-adapter.mjs`（Access必須）を変更せず、ブラウザー向けに`credentials:'omit'` + Neon Auth JWTで利用できる**別のWorker default export**を作成。両入口は`createCs03WorkerCandidate`を共有するためJWT署名検証、固定Origin、DO分散Quota、上流Neon secretの要件を維持。
- 新入口は`CS03_BROWSER_JWT_MODE=isolated-review-only`とCloudflareの`request.cf`がなければ503。これは認証の代替ではなく、JWT認証と実環境の入口保護は別途必須。`request.cf`だけで安全な外部公開が証明されたわけではない。
- `tests/cs03-browser-jwt-entrypoint.test.mjs`を追加し、モード不一致・bindings欠落・Cloudflare metadata欠落・誤ったfactoryを検査。`package.json`の既存一括試験にも追加。**開発PC未実行**。
- **新しい公開URL、Cloudflare Worker、DO、Access Policy、Secrets、CSP、GitHub Pagesは一切変更していない。** Workerのreview-only Wrangler設定は既存の運営者専用のまま。ブラウザー入口用の公開設定を勝手に追加しない。
- 次回は、ブラウザー専用入口におけるOPTIONS preflightの通過、JWTなしGET/PUTの401、署名偽造の401、DO故障503、Quota超過429、上流Neon未送信の**一括オフライン結合テスト**を実装する。ブラウザー用Worker URLを公開する前に、入口ごとのアクセス範囲・コスト・Fail closed・停止手順を別途承認する。

**状態：第一候補Aの入口を実装し始めたが、ローカルテスト未実行・実同期未成立・NO-GO。**

## 2026-11-24 02:00 リモート作業：ブラウザーJWT入口の結合受入テスト

- `tests/cs03-worker-entrypoint-full-chain.test.mjs` に新しいブラウザー専用入口 `createCs03BrowserJwtEntrypoint` を既存の署名JWT・共有DO・隔離Neon模擬実装につなぐテスト3件を追加。
- テスト内容：①正規JWTのPUT/GETが共有DOとNeon模擬処理に届く ②OPTIONS preflightは限定CORSで204、無効/偽造JWTは401、異Originは403、CF metadataなしは503、拒否時DO/Neon未呼出 ③DO quota超過で429、DO故障で503かつ上流Neon未呼出。
- 既存の運営者専用Access入口の試験はそのまま維持し、ブラウザー専用入口でAccess CookieやAccess service tokenを使わない。これは「認証不要」という意味ではなく、**Neon JWTを必須**にする分離構成。
- **未実行**：GitHubへのソース変更のみであり、NodeテストのPASSや実Cloudflare/Neon通信の成功は主張しない。Cloudflareリソース/URL/Secrets/CSP/Access Policy、GitHub Actions、mainは変更していない。
- 次の開発PCで `npm run test:cs03-worker-security` と `npm run test:cs03` をまとめて実行し、失敗時に原因を絞り込む。Cloudflare公開は引き続き独立承認と実経路/料金の安全審査が必要。

**公開判定：NO-GO、端末間実同期：未実施。**

## 2026-11-24 03:00 リモート作業：実アカウントクライアントのJWT入口接続試験

- 既存の `tests/cs03-worker-entrypoint-full-chain.test.mjs` にあった「実ブラウザーのアカウントクライアント → Worker → 共有DO → Neon模擬Function」の統合テストは、従来の**運営者用Access入口**を呼んでおり、利用者向けの実経路を検証できていなかった。これを**`h.browserEntry.fetch(r,h.env)`** に変更した。
- 2アカウントで同一ブラウザーStorageを共有する試験に変更し、保存・読取結果に加え、アカウント別Storageキーの分離とそれぞれのキャッシュ内容を確認するアサーションを追加。既存の署名済みJWT・Neon模擬保存・DO共有Quotaを使用し、ブラウザーから`cookie`や`cf-access-client-secret`が送られないことを確認する。
- **この修正はテスト経路の取り違えを解消するものであり、本番実装の完成やCloudflareの実配置を意味しない。** ローカルNodeテストは未実行。次回開発PCで`npm run test:cs03-worker-security`および`npm run test:cs03`を実行して初めてPASS/FAILを判定する。
- GitHub Actions、Cloudflare/Neon変更、URL/CSP、課金、main統合は実施していない。未承認の公開はNO-GO。

**次**：ブラウザーJWT入口のCORS preflightと本リクエストでCookieに依存しない動作、アカウント切替の途中で通信が完了した場合のローカルキャッシュ保護、Quotaの境界を引き続き点検する。

## 2026-11-24 アカウント切替中の非同期応答ガード

- `src/cs03-account-client.mjs` のJWT取得後、HTTP応答後、JSON解析後、pull/saveのローカル保存直前に認証ユーザーIDを再確認する。途中で別ユーザーに切り替わったら `ACCOUNT_CHANGED` を返し、旧ユーザーの遅延結果を画面・ローカル保存に反映しない。Cookie送信設定 `credentials:'omit'`、JWT署名検証、分散DO quota、Neon上流secretには変更なし。
- `tests/cs03-account-client.test.mjs` に、token待機中のアカウント切替でHTTP未送信、GET/PUT応答待機中の切替でローカル保存0件となる負試験3件を追加。
- 変更コミット `438913d`、テスト追加 `4b2db07`。**開発PC・ローカルリポジトリを使用していないため追加テストは未実行**。先行コミットの14/14 PASSを今回の修正結果と混同しない。
- 注意：すでに上流へ送信済みのPUTはサーバー側で保存される可能性がある。ここで保証するのは切替後の旧ユーザー応答の採用・ローカルキャッシュ書込み拒否であり、送信済みリクエストの取消しではない。
- 次回はブラウザー用Worker入口のCORS preflight・Quota境界と、ローカルテスト一括実行条件を検討。Cloudflare実配置・Neon秘密登録・公開は引き続きNO-GO。
