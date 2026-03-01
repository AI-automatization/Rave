import { defineConfig, devices } from '@playwright/test';

/**
 * CineSync Web — Playwright Config
 * Faqat Web UI (Next.js :3000) testlari uchun
 *
 * Ishga tushirish (apps/web/ papkasidan):
 *   npx playwright test
 *   npx playwright test tests/auth.spec.ts
 *   npx playwright show-report
 *
 * Root dan ishga tushirish:
 *   npx playwright test --project=web-chromium
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: '../../playwright-report/web', open: 'never' }],
  ],

  outputDir: '../../test-results/web',

  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
