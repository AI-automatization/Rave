import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = [
  '/home',
  '/movies',
  '/party/create',
  '/battle',
  '/friends',
  '/profile/me',
  '/achievements',
  '/notifications',
  '/settings',
  '/search',
  '/stats',
  '/my-videos',
];

test.describe('Protected Routes — /login ga redirect', () => {

  for (const route of PROTECTED_ROUTES) {
    test(`${route} → /login ga redirect qiladi`, async ({ page }) => {
      test.setTimeout(90000);
      // ERR_ABORTED (tez redirect) yoki normal navigation uchun try/catch
      try {
        await page.goto(route, { waitUntil: 'commit', timeout: 45000 });
      } catch {
        // ERR_ABORTED — redirect sabab navigation to'xtatildi, bu normal
      }
      // URL /login ga o'tganini kutamiz
      await page.waitForURL('**/login**', { timeout: 45000 });
      expect(page.url()).toContain('/login');
    });
  }

});
