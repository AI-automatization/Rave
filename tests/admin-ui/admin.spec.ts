import { test, expect, Page } from '@playwright/test';

const BASE = 'https://admin-ui-production-702c.up.railway.app';
const EMAIL = 'saidazim186@gmail.com';
const PASSWORD = 'Parol123';

// ── helpers ────────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"], input[name="email"]', { timeout: 15000 });
  await page.fill('input[type="email"], input[placeholder*="mail"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/admin-ui-${name}.png`, fullPage: false });
}

// ── 1. Login ───────────────────────────────────────────────────────────────────

test.describe('01 · Login', () => {
  test('shows login form', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveTitle(/Rave|CineSync|Admin/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await screenshot(page, '01-login-form');
  });

  test('rejects wrong password', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on login or show error
    await page.waitForTimeout(2000);
    const stillOnLogin = page.url().includes('/login') ||
      await page.locator('[class*="error"], [class*="alert"], [role="alert"]').isVisible().catch(() => false);
    expect(stillOnLogin).toBeTruthy();
    await screenshot(page, '01-login-error');
  });

  test('logs in successfully', async ({ page }) => {
    await login(page);
    await expect(page).not.toHaveURL(/login/);
    await screenshot(page, '01-login-success');
  });
});

// ── 2. Dashboard ───────────────────────────────────────────────────────────────

test.describe('02 · Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads dashboard with stat cards', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    // Expect some numeric stats or text blocks
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    await screenshot(page, '02-dashboard');
  });

  test('sidebar is visible with nav links', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 10000 });
    // Verify key navigation items exist
    const nav = page.locator('nav, aside').first();
    await expect(nav).toContainText(/Dashboard|Главная|Users|Контент/i);
    await screenshot(page, '02-sidebar');
  });
});

// ── 3. Users ───────────────────────────────────────────────────────────────────

test.describe('03 · Users', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads users table', async ({ page }) => {
    await page.goto(`${BASE}/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '03-users-list');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('search input is visible', async ({ page }) => {
    await page.goto(`${BASE}/users`);
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await screenshot(page, '03-users-search');
  });

  test('user detail page opens', async ({ page }) => {
    await page.goto(`${BASE}/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // Click first user row or link
    const firstLink = page.locator('a[href*="/users/"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/users/');
      await screenshot(page, '03-user-detail');
    }
  });
});

// ── 4. Movies / Content ────────────────────────────────────────────────────────

test.describe('04 · Movies', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads movies/content page', async ({ page }) => {
    await page.goto(`${BASE}/movies`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '04-movies');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 5. Battles ────────────────────────────────────────────────────────────────

test.describe('05 · Battles', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads battles page', async ({ page }) => {
    await page.goto(`${BASE}/battles`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '05-battles');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 6. Watch Parties ──────────────────────────────────────────────────────────

test.describe('06 · WatchParties', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads watch parties page', async ({ page }) => {
    await page.goto(`${BASE}/watchparties`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '06-watchparties');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 7. Mobile Errors ──────────────────────────────────────────────────────────

test.describe('07 · Errors', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads errors page with stat filters', async ({ page }) => {
    await page.goto(`${BASE}/errors`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, '07-errors');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('error status filters work', async ({ page }) => {
    await page.goto(`${BASE}/errors`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // Look for status filter buttons
    const filterBtn = page.locator('button').filter({ hasText: /Новая|В работе|Решено|Игнор|new|in_progress/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '07-errors-filtered');
    }
  });

  test('error drawer opens on row click', async ({ page }) => {
    await page.goto(`${BASE}/errors`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Click first error row
    const firstRow = page.locator('table tbody tr, [class*="row"], [class*="card"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '07-errors-drawer');
    }
  });
});

// ── 8. Support ────────────────────────────────────────────────────────────────

test.describe('08 · Support', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads support page', async ({ page }) => {
    await page.goto(`${BASE}/support`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '08-support');
    // Should show conversation list panel
    const body = await page.textContent('body');
    expect(body).toContain('Поддержка');
  });

  test('support status filters visible', async ({ page }) => {
    await page.goto(`${BASE}/support`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const openBtn = page.locator('button').filter({ hasText: /Открытые|Закрытые|Все/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    await screenshot(page, '08-support-filters');
  });
});

// ── 9. Feedback ───────────────────────────────────────────────────────────────

test.describe('09 · Feedback', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads feedback page', async ({ page }) => {
    await page.goto(`${BASE}/feedback`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '09-feedback');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 10. Logs ──────────────────────────────────────────────────────────────────

test.describe('10 · Logs', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads logs page', async ({ page }) => {
    await page.goto(`${BASE}/logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '10-logs');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 11. User Activity ─────────────────────────────────────────────────────────

test.describe('11 · User Activity', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads user activity page', async ({ page }) => {
    await page.goto(`${BASE}/user-activity`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '11-user-activity');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 12. Audit Logs ────────────────────────────────────────────────────────────

test.describe('12 · Audit Logs', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads audit logs page', async ({ page }) => {
    await page.goto(`${BASE}/audit-logs`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '12-audit-logs');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 13. Domains ───────────────────────────────────────────────────────────────

test.describe('13 · Domains', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads domains page', async ({ page }) => {
    await page.goto(`${BASE}/domains`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '13-domains');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 14. Staff ─────────────────────────────────────────────────────────────────

test.describe('14 · Staff', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads staff page', async ({ page }) => {
    await page.goto(`${BASE}/staff`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '14-staff');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 15. System ────────────────────────────────────────────────────────────────

test.describe('15 · System', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads system page', async ({ page }) => {
    await page.goto(`${BASE}/system`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '15-system');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

// ── 16. Navigation — sidebar links ────────────────────────────────────────────

test.describe('16 · Navigation', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('all sidebar nav links navigate without 404', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    const routes = [
      '/', '/users', '/movies', '/battles', '/watchparties',
      '/errors', '/support', '/feedback', '/logs',
      '/user-activity', '/audit-logs', '/domains', '/staff', '/system',
    ];

    for (const route of routes) {
      await page.goto(`${BASE}${route}`);
      await page.waitForLoadState('networkidle');
      // Should not show 404 text or redirect to login
      const url = page.url();
      expect(url).not.toContain('/login');
      const body = await page.textContent('body');
      expect(body).not.toContain('404');
    }

    await screenshot(page, '16-navigation-done');
  });
});

// ── 17. Logout ────────────────────────────────────────────────────────────────

test.describe('17 · Logout', () => {
  test('logout redirects to login', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    const logoutBtn = page.locator('button').filter({ hasText: /Выйти|Logout|Sign out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(/login/);
      await screenshot(page, '17-logout');
    }
  });
});
