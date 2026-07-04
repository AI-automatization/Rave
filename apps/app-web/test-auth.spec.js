// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3000';

// ─── Mock helper (har page.goto() DAN OLDIN chaqiriladi) ────────────────────
async function setupMocks(page) {
  // Register
  await page.route('**\/api\/v1\/auth\/register', (route) => {
    const body = route.request().postDataJSON();
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

  // Login
  await page.route('**\/api\/v1\/auth\/login', (route) => {
    const body = route.request().postDataJSON();
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
          },
          accessToken: 'mock_access_token_abc123',
          refreshToken: 'mock_refresh_token_xyz789',
        },
      }),
    });
  });

  // Logout
  await page.route('**\/api\/v1\/auth\/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true }) }),
  );

  // Settings (users/me/settings DAN OLDIN qo'shish — Playwright LIFO order)
  await page.route('**/users/me/settings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { notifications: {
        friendRequest: true, battleInvite: true, battleResult: true,
        partyInvite: true, achievement: true, system: true,
      } } }) }),
  );

  // users/me
  await page.route('**/users/me/avatar', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { avatar: '' } }) }),
  );

  await page.route('**/users/me**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'user_123', username: 'testuser', email: 'test@test.com',
          rank: 'Bronze', totalPoints: 0 },
      }) }),
  );

  // /home sahifasi ma'lumotlari
  await page.route('**/movies**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) }),
  );
  await page.route('**/battles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }) }),
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

  test("T1: Bo'sh forma — validatsiya xatolari ko'rinadi", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    // "Ro'yxatdan o'tish" tugmasini bosish
    await page.getByRole('button', { name: /o.tish/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first())
      .toBeVisible({ timeout: 3000 });
  });

  test("T2: Noto'g'ri username (maxsus belgi) — xato ko'rinadi", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('bad user!');
    await page.locator('input[name="email"]').fill('test@test.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirm"]').fill('password123');
    await page.getByRole('button', { name: /o.tish/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first())
      .toBeVisible({ timeout: 3000 });
  });

  test("T3: Parol mos kelmaydi — xato ko'rinadi", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('validuser');
    await page.locator('input[name="email"]').fill('test@test.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirm"]').fill('different123');
    await page.getByRole('button', { name: /o.tish/i }).click();
    await expect(page.locator('.label-text-alt.text-error').first())
      .toBeVisible({ timeout: 3000 });
  });

  test("T4: Muvaffaqiyatli ro'yxatdan o'tish — email xabari ko'rinadi", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/register`);
    await page.locator('input[name="username"]').fill('newuser');
    await page.locator('input[name="email"]').fill('new@test.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="confirm"]').fill('password123');
    await page.getByRole('button', { name: /o.tish/i }).click();
    // "EMAIL TASDIQLANG" sahifasi ko'rinishi kerak
    await expect(page.locator('body'))
      .toContainText(/EMAIL TASDIQLANG|tasdiql|yuborildi/i, { timeout: 6000 });
  });

});

// ════════════════════════════════════════════════════════════════════════════
// LOGIN TESTLARI
// ════════════════════════════════════════════════════════════════════════════
test.describe('Login sahifasi', () => {

  test('T5: Login sahifasi yuklanadi', async ({ page }) => {
    await setupMocks(page);
    // Dev server birinchi marta route kompilyatsiya qilishi uchun uzoqroq kutish
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    // 404 bo'lsa qayta urinish
    if (page.url().includes('404') || !(await page.locator('input[type="email"]').count())) {
      await page.reload({ waitUntil: 'networkidle' });
    }
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
  });

  test("T6: Bo'sh login forma — validatsiya xatolari", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page.locator('.label-text-alt.text-error').first())
      .toBeVisible({ timeout: 3000 });
  });

  test("T7: Noto'g'ri parol — xato alert ko'rinadi", async ({ page }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page.locator('.alert.alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.alert.alert-error'))
      .toContainText(/noto.g.ri|xato/i);
  });

  test("T8-T10: Muvaffaqiyatli login → /home, cookie va localStorage", async ({ page, context }) => {
    await setupMocks(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();

    // T8: /home redirect
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });

    // T9: cookie
    const cookies = await context.cookies(BASE);
    const tokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(tokenCookie?.value).toBe('mock_access_token_abc123');

    // T10: localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBe('mock_access_token_abc123');
    const rToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    expect(rToken).toBe('mock_refresh_token_xyz789');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS / LOGOUT TESTLARI
// ════════════════════════════════════════════════════════════════════════════
test.describe('Settings — Logout', () => {

  test('T11: Logout → /login redirect, tokenlar tozalanadi', async ({ page, context }) => {
    // 1) Login
    await setupMocks(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="email"]').fill('test@test.com');
    await page.locator('input[type="password"]').fill('pass123');
    await page.getByRole('button', { name: 'Kirish' }).click();
    await expect(page).toHaveURL(`${BASE}/home`, { timeout: 8000 });

    // 2) Settings sahifasi
    await setupMocks(page);
    await page.goto(`${BASE}/settings`);
    // Sahifa to'liq yuklanishini kutish
    await expect(page.locator('h1')).toContainText(/SOZLAMALAR/i, { timeout: 5000 });
    // btn-error → asosiy logout tugmasi (TopBar dagi Chiqish emas)
    const logoutBtn = page.locator('button.btn-error');
    await expect(logoutBtn).toBeVisible({ timeout: 4000 });

    // 3) Logout
    await logoutBtn.click();
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });

    // 4) Cookie tozalangan
    const cookies = await context.cookies(BASE);
    const tokenCookie = cookies.find((c) => c.name === 'access_token');
    expect(tokenCookie?.value ?? '').toBe('');
  });

});
