import { defineConfig, devices } from '@playwright/test';

/**
 * CineSync — Root Playwright Configuration
 * Web UI + Backend API (barcha 7 servis) testlari
 *
 * Ishga tushirish:
 *   npx playwright test                           — barcha testlar
 *   npx playwright test --project=web-chromium    — faqat web UI (Chrome)
 *   npx playwright test --project=api-auth        — faqat auth API
 *   npx playwright test --grep @smoke             — faqat smoke testlar
 *   npx playwright test --grep @api               — faqat API testlar
 *   npx playwright show-report                    — HTML report ochish
 *
 * Papkalar:
 *   test-results/     — screenshots, videos, traces (xato bo'lganda)
 *   playwright-report/ — HTML report
 *   screenshots/       — manual debug screenshotlar
 */
export default defineConfig({
  // ─── GLOBAL SETTINGS ─────────────────────────────────────────────────

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,

  // ─── REPORTERS ───────────────────────────────────────────────────────

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // ─── ARTIFACTS ───────────────────────────────────────────────────────

  outputDir: 'test-results',

  // ─── GLOBAL USE ──────────────────────────────────────────────────────

  use: {
    // Xato bo'lganda screenshot olish
    screenshot: 'only-on-failure',

    // Xato bo'lganda video saqlash
    video: 'retain-on-failure',

    // Xato bo'lganda trace saqlash (playwright show-trace ile analiz)
    trace: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  // ─── PROJECTS ────────────────────────────────────────────────────────

  projects: [

    // ═══ WEB UI TESTS (Next.js :3000) ═══════════════════════════════════

    {
      name: 'web-chromium',
      testDir: './apps/web/tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'web-firefox',
      testDir: './apps/web/tests',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'web-mobile-chrome',
      testDir: './apps/web/tests',
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'web-mobile-safari',
      testDir: './apps/web/tests',
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:3000',
      },
    },

    // ═══ BACKEND API TESTS ═══════════════════════════════════════════════
    // API testlar uchun browser shart emas — request fixture ishlatiladi

    {
      name: 'api-auth',
      testDir: './tests/api/auth',
      use: { baseURL: 'https://auth-production-47a8.up.railway.app' },
    },
    {
      name: 'api-user',
      testDir: './tests/api/user',
      use: { baseURL: 'https://user-production-86ed.up.railway.app' },
    },
    {
      name: 'api-content',
      testDir: './tests/api/content',
      use: { baseURL: 'https://content-production-4e08.up.railway.app' },
    },
    {
      name: 'api-watch-party',
      testDir: './tests/api/watch-party',
      use: { baseURL: 'https://watch-part-production.up.railway.app' },
    },
    {
      name: 'api-battle',
      testDir: './tests/api/battle',
      use: { baseURL: 'https://battle-production-238a.up.railway.app' },
    },
    {
      name: 'api-notification',
      testDir: './tests/api/notification',
      use: { baseURL: 'https://notification-production-9c30.up.railway.app' },
    },
    {
      name: 'api-admin',
      testDir: './tests/api/admin',
      use: { baseURL: 'https://admin-production-8d2a.up.railway.app' },
    },
  ],
});
