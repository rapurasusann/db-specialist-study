# CS-02 ブラウザ受入試験（2026-11-16）

対象: PR #14 / branch `docs/neon-sync-resumption-20261116`。Node全8件PASSを確認済み。ここではローカルの隔離ブラウザ領域で、実際の保存・復元を確認する。**本番サイトや既存の普段使うブラウザの学習履歴は触らない。**

## 起動（開発PC）

1. 先に試験済みのフォルダ `%TEMP%\db-study-cs02-verify-20261116` を利用する。書込みを伴うGit操作やクリーンアップは不要。
2. PowerShellで一行を実行（Pythonランチャー `py` を利用）: `$p=Join-Path $env:TEMP 'db-study-cs02-verify-20261116'; if(!(Test-Path (Join-Path $p 'index.html'))){throw 'TEST_SITE_NOT_FOUND'}; py -m http.server 8765 --bind 127.0.0.1 --directory $p`
3. コマンドが待受になったら、**ブラウザのシークレットウィンドウ**で `http://127.0.0.1:8765/` を開く。試験終了時はPowerShellで Ctrl+C。
4. ローカルホストで見える学習データは、通常の `https://rapurasusann.github.io` のデータとはオリジンが異なる。シークレット利用でさらに日常のデータとの分離を行う。

## 受入手順（ブラウザ）

| ID | 操作 | 期待結果 |
|---|---|---|
| UI-01 | 初回表示→「過去問学習」→午前Ⅱ・問1 | 問題・選択肢・原本画像が表示される。画面が白紙にならない |
| UI-02 | 問1で「要復習」を押してダッシュボードへ | 学習済み数が1増え、習熟度に反映される |
| UI-03 | 問1に戻りアを選択→「解答を判定」 | 正解と表示され、履歴が更新される |
| UI-04 | 問2へ移動→問1へ戻る | 前回の判定・理解度は残り、回答ラジオは未選択 |
| UI-05 | 「記録をバックアップ」でJSON保存 | `db-study-backup-v1` 形式で、`progress['2025:am2:1']` を含み、`progress['db:2025:am2:1']` は含まない |
| UI-06 | 問1を「習得済み」に変えた後、UI-05のファイルを「記録を復元」 | 上書き確認後、UI-05時点の「学習中」に戻る。問1の履歴が消えない |
| UI-07 | ブラウザ再読み込み | 保存済みの問1の理解度が残る。回答ラジオは未選択 |
| UI-08 | 午後Ⅰ・問1を開き記述解答を入力→別問→戻る | 記述解答が保持される。午前Ⅱ・問1の記録と混ざらない |
| UI-09 | 開発者ツールConsole | CSP拒否・JavaScript例外がない（外部PDFリンク失敗のような通信制約は別記録） |

## 結果記録

- 各項目 PASS / FAIL / 未実施を区別する。スクリーンショットは任意。
- PASS が揃うまでCS-02をCLOSEDにしない。実ブラウザでの確認をNodeのユニットテストで代替したとは記録しない。
- 問題が起きたときは試験IDと画面の状況・Consoleエラーを記録して修正する。
- この操作はテスト用のシークレットウィンドウで完結させる。クラウド接続のログインは行わない。

## 2026-11-17 追記：PlaywrightでUI-01〜UI-09を自動実行

- `playwright.config.cjs`: インストール済みGoogle Chromeをヘッドレス実行。ワーカー1、失敗時だけスクリーンショットとトレースを保存。
- `tests/serve-static.cjs`: 試験フォルダをローカルホスト `127.0.0.1:8766` のみで配信。ポート8765とは独立。
- `tests/browser.e2e.spec.cjs`: 午前Ⅱの原本画像、理解度、採点、移動、バックアップの旧キー、復元、再読込、午後Ⅰ記述解答、JavaScript/CSP例外を順番に自動検証する。
- PlaywrightのBrowserContextはテストごとに隔離され、ブラウザの普段使いの学習履歴を使用しない。バックアップと復元は試験で作成したデータのみで実施。
- クラウド同期のログイン、Neon DBへの書き込み、GitHub Actionsは実施しない。
- 作成・GitHub保存とコード構文の検査は完了。**実ChromeでのE2E結果はまだ未検証**。

### 実行（PowerShell 1行）

`$p=Join-Path $env:TEMP 'db-study-cs02-verify-20261116'; if(!(Test-Path (Join-Path $p 'index.html'))){throw 'TEST_FOLDER_NOT_FOUND'}; if(git -C $p status --porcelain){throw 'WORKTREE_NOT_CLEAN'}; git -C $p pull --ff-only; if($LASTEXITCODE -ne 0){throw 'PULL_FAILED'}; Push-Location $p; try {npm install --no-save --no-package-lock @playwright/test; if($LASTEXITCODE -ne 0){throw 'PLAYWRIGHT_INSTALL_FAILED'}; & '.\\node_modules\\.bin\\playwright.cmd' test --config=playwright.config.cjs; Write-Host "E2E_EXIT_CODE=$LASTEXITCODE"} finally {Pop-Location}`

- npmのインストール先は隔離されたTEMP試験リポジトリの `node_modules` のみ。
- インストール済みのGoogle Chromeを使用（PlaywrightのChromiumダウンロードは不要）。
- PASS条件: UI-01〜UI-09の各ステップが完了し、PlaywrightテストがPASS、`E2E_EXIT_CODE=0`。
- FAILなら該当ステップ名・エラーを修正してから再試験する。ブラウザE2Eの未実施をPASSとは記録しない。
