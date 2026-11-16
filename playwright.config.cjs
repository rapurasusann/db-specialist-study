'use strict';
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.spec.cjs',
  timeout: 60000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8766',
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/serve-static.cjs',
    url: 'http://127.0.0.1:8766/',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
