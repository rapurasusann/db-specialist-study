'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test('CS-02 UI-01 to UI-09: question, progress, backup, restore, reload and written response', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', err => runtimeErrors.push(String(err)));
  page.on('console', msg => {
    if (msg.type() === 'error' && /Content Security Policy|Refused to (execute|load)|Uncaught/i.test(msg.text())) {
      runtimeErrors.push(msg.text());
    }
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await test.step('UI-01 午前Ⅱ問1と原本画像', async () => {
    await page.locator('#viewStudy').click();
    await page.locator('#courses button').filter({ hasText: '午前Ⅱ' }).click();
    await expect(page.locator('#currentTitle')).toContainText('午前Ⅱ・問1');
    await expect(page.locator('#questionText')).toContainText('プロパティグラフ');
    await expect(page.locator('#questionText .optionText')).toHaveCount(4);
    await expect(page.locator('#pageImage')).toHaveJSProperty('complete', true);
    await expect.poll(() => page.locator('#pageImage').evaluate(el => el.naturalWidth)).toBeGreaterThan(0);
  });
  await test.step('UI-02 要復習を保存しダッシュボードへ反映', async () => {
    await page.locator('[data-level="review"]').click();
    await page.locator('#viewDashboard').click();
    await expect(page.locator('#studied')).toHaveText('1 / 60');
    await page.locator('#viewStudy').click();
    await expect(page.locator('#history')).toContainText('要復習');
  });
  await test.step('UI-03 正答を判定し保存', async () => {
    await page.locator('#choices input[value="ア"]').check();
    await page.locator('#grade').click();
    await expect(page.locator('#gradeResult')).toContainText('正解');
    await expect(page.locator('#history')).toContainText('学習中');
    await expect(page.locator('#accuracy')).toHaveText('100%');
  });
  await test.step('UI-04 別問題から戻ると解答だけリセット', async () => {
    await page.locator('#next').click();
    await expect(page.locator('#currentTitle')).toContainText('問2');
    await page.locator('#questions button').filter({ hasText: /^1$/ }).click();
    await expect(page.locator('#history')).toContainText('学習中');
    await expect(page.locator('#gradeResult')).toContainText('前回までの判定：正解');
    await expect(page.locator('#choices input:checked')).toHaveCount(0);
  });
  let originalBackup;
  await test.step('UI-05 JSONバックアップに旧DBキーと履歴がある', async () => {
    const pending = page.waitForEvent('download');
    await page.locator('#backup').click();
    const download = await pending;
    originalBackup = fs.readFileSync(await download.path());
    const data = JSON.parse(originalBackup.toString('utf8'));
    expect(data.format).toBe('db-study-backup-v1');
    expect(data.progress['2025:am2:1']).toMatchObject({
      level: 'learning', correct: true, attempts: 1,
    });
    expect(data.progress['db:2025:am2:1']).toBeUndefined();
  });
  await test.step('UI-06 理解度を変更してJSONから元に戻す', async () => {
    await page.locator('[data-level="mastered"]').click();
    await expect(page.locator('#history')).toContainText('習得済み');
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#restore').setInputFiles({
      name: 'cs02-backup.json',
      mimeType: 'application/json',
      buffer: originalBackup,
    });
    await expect(page.locator('#history')).toContainText('学習中');
    await expect(page.locator('#gradeResult')).toContainText('前回までの判定：正解');
    await expect(page.locator('#studied')).toHaveText('1 / 60');
  });
  await test.step('UI-07 再読込でも履歴が残り未選択から開始', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#viewStudy').click();
    await expect(page.locator('#currentTitle')).toContainText('午前Ⅱ・問1');
    await expect(page.locator('#history')).toContainText('学習中');
    await expect(page.locator('#gradeResult')).toContainText('前回までの判定：正解');
    await expect(page.locator('#choices input:checked')).toHaveCount(0);
  });
  await test.step('UI-08 午後Ⅰ記述解答は移動後も残り午前Ⅱと独立', async () => {
    await page.locator('#courses button').filter({ hasText: '午後Ⅰ' }).click();
    await expect(page.locator('#currentTitle')).toContainText('午後Ⅰ・問1');
    await page.locator('#written').fill('CS02保存テスト123');
    await page.locator('#next').click();
    await page.locator('#questions button').filter({ hasText: /^1$/ }).click();
    await expect(page.locator('#written')).toHaveValue('CS02保存テスト123');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('db-study-progress-v1')));
    expect(stored['2025:pm1:1'].written).toBe('CS02保存テスト123');
    expect(stored['2025:am2:1']).toMatchObject({ level: 'learning', correct: true, attempts: 1 });
    await page.locator('#courses button').filter({ hasText: '午前Ⅱ' }).click();
    await expect(page.locator('#history')).toContainText('学習中');
  });
  await test.step('UI-09 重大なJavaScript/CSPエラーなし', async () => {
    expect(runtimeErrors).toEqual([]);
  });
});
