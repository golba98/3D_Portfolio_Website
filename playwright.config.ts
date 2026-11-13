import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 180_000, workers: 1,
  outputDir: '.private/playwright-results',
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:5174', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { args: ['--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
});
