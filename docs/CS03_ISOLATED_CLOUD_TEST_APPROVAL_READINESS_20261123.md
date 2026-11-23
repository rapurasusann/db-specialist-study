# CS-03 実クラウド隔離接続試験：影響範囲・費用・停止・切戻し計画（事前確認）
2026-11-23。**配置未承認／本番公開NO-GO**。この文書は承認の代替ではない。外部サービスに対する作成・書込・削除・Secret登録・公開ルート変更・プラン変更は行っていない。

## 1. 2026-11-23時点の実環境読み取り
| 項目 | 取得結果 | 安全境界 |
|---|---|---|
| Neon project | `quiet-mouse-39990305`（名前`certification-study`、Singapore AWS `aws-ap-southeast-1`、PG18） | 他プロジェクトへ配備しない |
| Neon branch | `br-snowy-truth-a162pmdt`（`cs03-auth-isolation-20261117`、ready、default=false） | default branchへ配備しない |
| Neon Function | `list_functions`で**0件** | 初回Function作成には別承認 |
| Neon compute | 専用branchのread_write Compute 1件、idle | DB/compute設定を変更しない |
| Cloudflare | 既存証跡は専用Certification-StudyアカウントWorkers Free、支払方法なし、Worker/DO未配備 | **今回のCloudflare管理画面状態は再取得していない**。実操作前に対象account/plan/支払設定/利用量の再点検必須 |
| アプリ | `cs03-config.js`は`previewEnabled:false`、外部接続URL未設定。ブラウザCSPは外部接続非許可 | 公開設定・CSP・GitHub Pagesを変更しない |
| コード | 関連ルート・Neon bundle含む開発PC試験29/29 PASS | 実環境での安全性・費用の保証ではない |

## 2. 予定する試験の対象（**まだ実施しない**）
- Neon側：上記projectの**非default branchだけ**で、CS-03用1 FunctionをNode24で動かす。既存Neon Auth／DB／RLS構成を変更しない。初回のFunction bundle、環境変数、DBの読取/書込試験を行う場合は**実配備の独立した承認と安全な秘密投入経路**を要する。
- Cloudflare側：専用Certification-Studyアカウントにのみ、WorkerとSQLite-backed Durable Objectを検討。**既存TsumuTango／ParkWaitアカウント、ルート、ドメインは一切利用しない**。Cloudflare上の`request.cf`チェックだけではIngress真正性の証明にはならない。
- 対外HTTP：NeonのFunction呼び出しURLはFunction作成後の`invocation_url`をNeonから取得し、**推測・組立てしない**。Functionの`/`と既存`/progress`はローカルで29/29 PASS。実接続では作成済みの隔離URLのみを使用。
- プレビュー：`previewEnabled`、CSP、Pagesへの認証UI公開を今は変えない。クラウド間の限定通信を検証できる接続方法が決まるまでは公開ルートを追加しない。

## 3. 費用・上限・異常時動作
**Neon公式プラン** https://neon.com/docs/introduction/plans ：FunctionsはFreeにも含まれ、**月100万呼び出し、10 active / 400 waiting Capacity-Hours（project単位）**。Neon FreeのPostgres計算資源は月100 CU-hours/project、ストレージ1 GB/project、egress月5 GB/project（Neon Functions含む）。これは**公開されたプラン枠**であり、今回実プロジェクトの加入プラン/消費済みFunctions枠を請求画面で確定していない。実プロジェクトの作業前に確認必須。プラン変更・支払登録はしない。

**Cloudflare公式** https://developers.cloudflare.com/workers/platform/limits/ 、https://developers.cloudflare.com/workers/platform/pricing/ 、https://developers.cloudflare.com/durable-objects/platform/pricing/ ：Workers Freeの1日100,000リクエスト（UTC日付でリセット）と、Workers/DO別のCPU/requests/storage/SQL等の上限。数字は事前の公式値であり、実アカウント固有の最新制限・改定を当日再点検。**Free枠超過時の無条件の請求ゼロ保証はしない**。有料プランや自動アップグレードは禁止。

**重要なFail closed**：Cloudflare Workers routeでは上限到達時の「Fail open」がWorkerを迂回しうる。https://developers.cloudflare.com/workers/platform/limits/ 。認証・Quotaを回避してデータへ直接届かない構成が必須。fail-closed動作が証明できないルートは作らない。Neon Function直URLも存在するため、**共有秘密・JWT・Originの全チェックをNeon側で保持**。NeonやDO障害では保存失敗を返し、正常保存を偽装しない。

## 4. 停止・復旧の条件（作業開始前に確定）
1. **通常停止**：利用者プレビューOFFを維持。将来試験Ingressを設ける場合は、外部経路を閉じてWorker→Functionを遮断する運用操作と、Functionの直URL保護の双方を事前に文書化。**公開URLを隠すだけではアクセス制御にならない**。
2. **異常時**（quota超過／予想外の請求／401/403以外の不審な応答／秘密漏えい懸念／既存環境への影響）：**通信試験を即時中止**。Cloudflare側経路遮断だけではNeon Function直URLを閉じられないため、Function側のSecret失効/変更、Function停止・削除に相当する操作方法まで承認手順に含める。削除・失効操作の自動実施は許可されていない。
3. **切戻し**：事前の構成証跡（名称・ID・既存値に秘密を含めない）、投入物の一覧、影響するブランチとWorkerの一覧を保管。初回配置したCS-03専用リソースのみ停止/撤去し、**既存DB・Auth・他プロジェクトのデータは削除しない**。ロールバックが保証されない秘密更新／DB変更は初回試験の対象外。
4. **回復**：停止理由、Cloudflare/Neon使用量、エラーログの秘匿確認を行い、再開には対象を示した承認を得る。無料枠の上限に達したらサービス停止を許容し、認証やQuotaを迂回しない。

## 5. 実クラウド接続に残る受入条件
| ID | 未完了条件 | 承認前に必要な証拠 |
|---|---|---|
| C01 | Cloudflare実アカウントとFree/DO上限 | 専用accountとplan・支払方法・上限・現使用量の最新読取 |
| C02 | 非公開・限定テストIngress | 認証回避できない経路設計／Fail closedの設定と検証方法 |
| C03 | Neon Function実ビルド・env・URL | 非default branch明示、秘密の非露出、Function直アクセス拒否、実接続の段階的手順 |
| C04 | Cloudflare DO運用と上流停止 | 429/503時の上流未呼出と、リソース停止・ログ点検・切戻し手順 |
| C05 | 課金増加の停止策 | アカウント単位のFree利用量観測、閾値、超過時の即時停止方法。請求ゼロ保証不可 |
| C06 | 公開可否 | 実隔離試験の成功後も、公開プレビュー・CSP・本番mainは別途承認 |

## 6. 承認の分離
- **現段階：読み取りとローカルコード/文書だけ許可**。Neon Functions 0件のまま維持。
- **将来：Neon隔離Functionの初回作成/secret注入**、**Cloudflare Worker/DO作成と制限付き入口**、**プレビュー/本番公開**は異なる操作であり、各々の対象・費用・停止手順と承認を明示する。前段の「はい」を後段の承認へ流用しない。
- GitHub Actions、他アプリ・他account、本番main、支払登録、有料化は対象外。

**総合判定：事前計画を文書化済み。ただしC01–C06未完了。現在の実クラウド配置・本番公開はNO-GO。**
