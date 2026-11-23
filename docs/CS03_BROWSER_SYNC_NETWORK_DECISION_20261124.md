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
