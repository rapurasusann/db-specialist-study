# CS-03 Cloudflare Accessによる隔離試験Ingress（読み取り仕様レビュー、2026-11-23）

**判定：設計候補特定、実Cloudflareアカウント未検証、配置・秘密登録・試験URL作成NO-GO。** この文書は承認を意味しない。

## 1. 調査対象と現在分かる状態
- 対象：Cloudflare **Certification-Study** 専用アカウントのWorkers FreeとDurable Objects。TsumuTango/ParkWaitの別アカウント・ドメイン・Workerは対象外。
- 既存証跡では専用アカウントのWorkers Free Active、支払方法なし、Worker/DOデプロイなし。ただし **2026-11-23時点のCloudflare実アカウントに接続して最新利用量・plan・Billing・Access有効化状況を確認できるコネクタがない**。従って実アカウント側のFree/利用量/支払/Access可否は**OPEN**。画面証拠を新規に取得したと記載しない。
- Neon側は専用`quiet-mouse-39990305`の非default branch `br-snowy-truth-a162pmdt`、Functions 0件（当日の読み取り）、Neon実配置は独立承認まで禁止。
- アプリは`cs03-config.js`で`previewEnabled:false`、公開URLなし、GitHub Pages/CSP変更なし。ローカルNeon経路試験29/29 PASSはクラウド検証ではない。

## 2. 推奨する試験用Ingress候補

**Cloudflare Accessで、対象Worker全体（production workers.devおよびpreviewへの到達を含む）を先に保護する方式**を候補とする。

- 公式仕様：Cloudflare Accessは**Worker実行前**にAccess Policyを確認して非許可利用者を遮断。Worker単位の保護ならroute/custom domain/workers.dev/previewすべてを一括で対象にできる（単なるhostname単位保護より経路抜けが起こりにくい）。資料：https://developers.cloudflare.com/workers/configuration/cloudflare-access/ 、https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/ 。
- **重要**：Accessは公開到達可能なURLへの認証ゲートであり、存在しないURLを使う「完全非公開」ではない。既存の`workers_dev:false`と`preview_urls:false`で公開経路がゼロのままなら実ブラウザ/HTTP試験はできない。将来一時的なURLを作成する場合は、**Accessポリシー先行設定・対象Worker保護・許可者明示・拒否受入・アクセスのない別経路不存在を確認**し、公開URLを有効にする別承認が必要。
- 事前にCloudflare Zero Trustの利用可否・契約料金/利用者数・Access appの設定権限を実アカウントで確認する必要がある。無料利用を仮定して勝手に有効化しない。
- Worker側はJWT（Neon Auth署名）、`CS03_QUOTA` DOで上流アクセス前に認可/全体・IP・ユーザー制限、`CS03_GATEWAY_SECRET`をNeonの`CS03_ORIGIN_SECRET`と整合させる。Neon Functionの直URLはAccessが守らないため**Function側でも共有秘密/JWT/Origin拒否を強制**。
- Accessの許可対象は**試験担当者1名を想定した最小範囲**とし、email domain全体・組織全員の無条件許可はしない。Access Service Tokensを使う場合は認証形式と秘密保存・失効の設計を別途審査する。

## 3. Fail closedと料金
- Cloudflare公式 https://developers.cloudflare.com/workers/platform/limits/ はWorkers Free **100,000 req/日（00:00 UTC更新）**、CPU上限などを示す。Free上限到達時、**Worker routes** の`Fail open`はWorkerを迂回しうるため禁止、`Fail closed`はCloudflare 1027を返す。**具体的なルート形態ごとに適用可否・設定値・動作を検証する必要がある**。Access単独でコスト上限やWorker失敗時の認証不迂回を保証するとは断定しない。
- Durable Objects FreeはWorkerと別の資源・上限がある。構成・実数値・課金ルール・停止方法を本番アカウントで実確認するまで、**運営者が追加料金ゼロを保証できる状態ではない**。有料プラン・支払い登録・無条件オートアップグレード禁止。
- プレビューをOFFのままにしても、作ったFunctionの直URLへはアクセスされうる。**外部接続可能なFunctionを作れば攻撃面とFree使用量が増える**ため、配置と秘密登録は個別承認の対象。

## 4. 受入・停止・切戻し手順（実行前計画）
1. **先行条件**：CloudflareアカウントID/対象の読取、plan/料金/請求情報の非機密な証拠、Access利用可能性、既存ルート一覧の照合。Neon隔離FunctionのURLと上流 secret の安全な設定経路、DOの容量制限・429/503試験方式。
2. **Ingress作成前条件**：第三者からの未認証アクセスがAccessで拒否される、WorkerからNeon側の秘密なし直リクエストも401で拒否される、Worker routingの上限時動作が**Fail closed**と検証できる。これを設定/現物の監査証拠とし、許可者は限定。
3. **試験時の停止トリガー**：予期しない2xx、プラン課金・利用量の増加、403/401回避、Worker/DOからNeonの直URL/他環境へ流出、DPA/認証の不一致が出た場合、通信試験を中止。手動でAccessの許可を外し、対象Workerの一時公開経路を閉じ、Neonの直URL対策を別に実施する。Accessだけの停止はNeonを止めない。
4. **切戻し対象**：**今回新規の専用Worker/Access policy/DO/Neon Function**に限定。既存ドメイン・既存プロジェクトの変更/DB削除はしない。削除は破壊的なので独立に許可された時だけ。
5. **再開条件**：ブロック理由と使用量・ログを確認し、実配置/公開を改めて個別承認。失敗時にJWT・Quotaを省略して続行しない。

## 5. C01/C02の判定と次の手順

| ゲート | 判定 | 解決に必要な次の事実 |
|---|---|---|
| C01: 専用Cloudflare実アカウント最新確認 | **OPEN** | Workers Free/DO/Zero Trustの使用・請求・支払い設定・Access可否を実アカウントのダッシュボード等から読み取る（秘密・カード番号不要） |
| C02: 限定Ingressの方式設計 | **CONDITIONAL** | Cloudflare AccessのWorker全体保護を候補化。事前のAccess有効化・未認証拒否・公開経路全列挙・fail-closed実証が必要 |
| C03: Neon Function初回配置 | **OPEN** | NeonはFunction 0件。独立した配置承認後のみ |
| 公開判定 | **NO-GO** | クラウド実証後に改めてリリース判定 |

**今回：公式情報とGitHub記録の読み取りだけ。Cloudflare/Neonへの書き込み、Secrets、GitHub Actions、route切替、Workers/DO作成、課金変更は行っていない。**

## 6. Certification-StudyのWorkers画面確認（ユーザー提出：2026-11-23）

ユーザー提出のCloudflareダッシュボード画像（Certification-Studyアカウント、Workers & Pages日本語表示）を目視確認。画面右側に**本日のリクエスト 0 / 100,000**、**今日の観測可能性イベント 0 / 200,000**が表示。中央に**プロジェクトが見つかりませんでした**／まだプロジェクトを作成していない旨が表示されている。**Cloudflareへのアクセス**カードには「ゼロトラストを設定する」ボタンがあり、現時点でCloudflare Accessの設定済み／利用可能なプラン／料金／ポリシーは確認できない。

**画面の範囲**：Worker/Pages側でアプリ0件・当日使用量0を確認したが、Durable Objectsの実使用量/実配置の全容、Workers Freeの契約内容・課金状況、支払方法の登録有無、Zero Trust/Accessのアクティベーション状況は画像から断定できない。画面内にCloudflareアカウントIDが含まれていたため、この記録では再掲しない。

**C01の進捗**：専用アカウント、Workersの当日リクエスト数、当日観測イベント、Worker/Pages 0件の証拠は収集済み。**Billing / 支払い設定とDO / AccessはOPEN**。

**次の確認**：対象Certification-StudyのBilling画面でプラン・請求・支払方法の有無を確認し、Zero Trust/Accessについては設定開始せずプランや利用可否を調査する。カード番号やメールなどの秘匿情報は共有不要。Cloudflare/Neonへ書込・公開切替・課金変更なし、**NO-GO維持**。
