# CS-03 ゼロ追加料金の中継サービス検討（2026-11-23）
**結論: Cloudflare Workers Free を第一候補として設計・検証する。配置・有料契約は行わない。**

## 調査根拠（公式）
- Cloudflare Workers Free は**100,000リクエスト/日**の制限（UTC 0時リセット）。この数値はWorkersの全リクエスト上限であり、Neonへの送信件数の制限を自動で保証しない。公式: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers Rate Limiting API のカウンターは**Cloudflareロケーションごと**。全球で一律の厳密な上限ではない。公式: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Neon Free はプロジェクト単位のCU時間・ストレージ・転送量の上限がある。無料枠を使い切ると利用停止する可能性があり、サービス可用性を保証しない。事前にユーザー契約・残枠を確認する。公式: https://neon.com/docs/introduction/plans

## 推奨する分離
Browser (公開GitHub Pages / 未有効) → Cloudflare Worker (本人JWT厳格検証、CORS、リクエスト制限、秘密情報の付与) → 隔離Neon Function (秘密確認、JWT再検証) → 隔離Postgres (本人RLS)。
Worker上に配置する秘密は `CS03_ORIGIN_SECRET` のみに限定する。DB接続文字列はNeon Functionだけに配置する。JWT・秘密・個人情報はログに残さない。

## NO-GO中の必須受入条件
1. 最終的なCloudflare Workerが実装されるまでは `server/cs03-trusted-edge-gateway.mjs` をローカル試作として扱い、デプロイ禁止。実クラウドの中継DNS、CORS、暗号化、秘密設定は未確認。
2. Workerロケーション単位の回数制限を**全球合算の上限と誤認しない**。複数ロケーションやWorker再起動の跨ぎを想定した総量制御か、Neon側で停止・制限できる手順を設計して試験する。
3. 料金保証にはプラン条件の確認、予算制限・通知・停止手順、Neon Functionsの利用可否と枠、Cloudflare Freeの上限超過挙動を含める。『課金しない』と『サービスが止まらない』は両立するとは限らない。
4. 匿名・不正署名・期限切れJWT・他人ID・直接Function URL・CORS不一致・大きいPUT・アクセス集中・二重保存競合で拒否系試験する。
5. 失敗した学習記録のダウンロード機能は完成しているが、ページ再読み込みをまたぐ自動保護・安全な復元は未完成。公開前に解消する。
6. `docs/CS03_GATEWAY_RATE_LIMIT_ACCEPTANCE.md` は**受入試験と運用上限が実証済みとなった場合のみ作成**する。文書作成だけでNO-GOを解除しない。最終的に配置前の明示的承認と切戻し条件が必要。

## 次工程
- ローカル限定でCloudflare Worker相当のリクエスト経路とJWT→中継→Neon Functionの失敗系を統合試験。
- 可能なら外部料金を発生させない設定で、Cloudflareのサービス仕様とNeon Functionsの無料枠の組み合わせを確認。
- 受入完了までは `cs03-config.js` の `previewEnabled:false` を維持し、本番ブランチやNeon Functionsを変更しない。
