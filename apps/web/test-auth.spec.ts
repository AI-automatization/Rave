import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── Mock helper (har navigatsiyadan OLDIN chaqiriladi) ──────────────────────
async function setupMocks(page: Page) {
  await page.route('**/auth/register', (route) => {
    const body = route.request().postDataJSON() as Record<string, string> | null;
    if (body?.email === 'taken@test.com') {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Email already exists' }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Verification email sent' }),
    });
  });

  await page.route('**/auth/login', (route) => {
    const body = route.request().postDataJSON() as Record<string, string> | null;
    if (body?.password === 'wrongpass') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: "Email yoki parol noto'g'ri" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: 'user_123',
            username: 'testuser',
            email: body?.email ?? 'test@test.com',
            avatar: null,
            role: 'user',
            rank: 'Bronze',
            totalPoints: 0,
          },
          accessToken: 'mock_access_token_abc123',
        },
      }),
    });
  });

  await page.route('**/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true }) }),
  );

  // /home sahifasi uchun
  await page.route('**/movies**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) }),
  );
  await page.route('**/battles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) }),
  );
  await page.route('**/users/me**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'user_123', username: 'testuser', email: 'test@test.com',
          rank: 'Bronze', totalPoints: 0 },
      }) }),
  );
  await page.route('**/users/me/settings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { notifications: {} } }) }),
  );
  await page.route('**/notifications**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) }),
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REGISTER TESTLARI
// ════════════════════════════════════════════════════════════════════════════
test.describe('Register sahifasi', () => {

  test('T1: Bo\'sh forma — validatsiya xatolari ko\'rinadi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.getByRole('button', { name: /ro.yxatdan o.ting/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('T2: Noto\'g\'ri username (maxsus belgi) — xato ko\'rinadi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('bad user!');
    await page.locator('input[name="email"]').fill('test@test.com');
    await page.locator('input[name="password"]').fill('pass123');
    await page.locator('input[name="confirmPassword"]').fill('pass123');
    await page.getByRole('button', { name: /ro.yxatdan o.ting/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('T3: Parol mos kelmaydi — xato ko\'rinadi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('validuser');
    await page.locator('input[name="email"]').fill('test@test.com');
    await page.locator('input[name="password"]').fill('pass123');
    await page.locator('input[name="confirmPassword"]').fill('different');
    await page.getByRole('button', { name: /ro.yxatdan o.ting/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('T4: Muvaffaqiyatli ro\'yxatdan o\'tish — email tasdiqlash xabari', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('newuser');
    await page.locator('input[name="email"]').fill('new@test.com');
    await page.locator('input[name="password"]').fill('pass123');
    await page.locator('input[name="confirmPassword"]').fill('pass123');
    await page.getByRole('button', { name: /ro.yxatdan o.ting/i }).click();
    // Email tasdiqlash xabari yoki sahifa tekshirish
    await expect(page.locator('body')).toContainText(/tasdiql|email|yuborildi/i, { timeout: 5000 });
  });

});

// ════════════════════════════════════════════════════════════════════════════
// LOGIN TESTLARI
// ════════════════════════════════════════════════════════════════════════════
test.describe('Login sahifasi', () => {

  test('T5: Login sahifasi yuklanadi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('T6: Bo\'sh login forma — validatsiya xatolari', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page.locator('.label-text-alt.text-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('T7: Noto\'g\'ri parol — xato alert ko\'rinadi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page.locator('.alert.alert-error')).toBeVisible({ timeout: 4000 });
  });

  test('T8: Muvaffaqiyatli login → /home redirect', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });
  });

  test('T9: Login keyin access_token cookie o\'rnatiladi', async ({ page, context }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });
    const cookies = await context.cookies(BASE);
    const tokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(tokenCookie?.value).toBe('mock_access_token_abc123');
  });

  test('T10: Login keyin localStorage token o\'rnatiladi', async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBe('mock_access_token_abc123');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS / LOGOUT TESTLARI
// ════════════════════════════════════════════════════════════════════════════
test.describe('Settings — Logout', () => {

  test('T11: Logout → /login redirect va tokenlar tozalanadi', async ({ page, context }) => {
    // Avval login qilish
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });

    // Settings sahifasiga o'tish
    await setupMocks(page);
    await page.goto(`${BASE}/settings`);
    await expect(page.getByRole('button', { name: /chiqish/i })).toBeVisible({ timeout: 4000 });

    // Logout
    await page.getByRole('button', { name: /chiqish/i }).click();
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });

    // Cookie tozalangani
    const cookies = await context.cookies(BASE);
    const tokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(tokenCookie?.value ?? '').toBe('');
  });

});
