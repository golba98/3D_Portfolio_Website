import { defineConfig } from '@playwright/test';
const preview = process.env.PORTFOLIO_PREVIEW === '1';
const port = preview ? 4187 : 5174;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Software WebGL on hosted runners is slower than the local graphics stack.
  timeout: process.env.CI ? 300_000 : 180_000,
  workers: 1,
  outputDir: preview ? '.private/preview-results' : '.private/playwright-results',
  reporter: [['list']],
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `npm run ${preview ? 'preview' : 'dev'} -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
