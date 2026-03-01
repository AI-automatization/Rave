import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3006';
const TIMESTAMP = Date.now();
const TEST_USER = {
  username: `testuser${TIMESTAMP}`,
  email: `testuser${TIMESTAMP}@example.com`,
  password: 'TestPass123',
};

test.describe('Auth — Register & Login', () => {
  test('Register sahifasi yuklanadi', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page).toHaveTitle(/CineSync/i);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("Ro'yxatdan o'tish muvaffaqiyatli", async ({ page }) => {
    await page.goto(`${BASE}/register`);

    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirm"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Email tasdiqlash xabari ko'rinishi kerak
    await expect(page.getByText(/EMAIL TASDIQLANG|email/i)).toBeVisible({ timeout: 8000 });
  });

  test("Noto'g'ri parol bilan ro'yxatdan o'tish — validatsiya xatosi", async ({ page }) => {
    await page.goto(`${BASE}/register`);

    await page.fill('input[name="username"]', 'ab'); // 3 dan kam
    await page.fill('input[name="email"]', 'notvalidemail');
    await page.fill('input[name="password"]', '123'); // 8 dan kam
    await page.fill('input[name="confirm"]', '456'); // mos kelmaydi
    await page.click('button[type="submit"]');

    // Validatsiya xatolari ko'rinishi kerak
    await expect(page.locator('.text-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('Login sahifasi yuklanadi', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("Mavjud bo'lmagan foydalanuvchi bilan login — xato", async ({ page }) => {
    await page.goto(`${BASE}/login`);

    await page.fill('input[name="email"]', 'nouser@example.com');
    await page.fill('input[name="password"]', 'WrongPass123');
    await page.click('button[type="submit"]');

    // Xato xabari ko'rinishi kerak
    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 8000 });
  });

  test('PWA ikonkalar yuklanadi (404 yo\'q)', async ({ page }) => {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    for (const size of sizes) {
      const res = await page.request.get(`${BASE}/icons/icon-${size}x${size}.png`);
      expect(res.status(), `icon-${size}x${size}.png 404!`).toBe(200);
    }
  });

  test('API /auth/register endpoint ishlaydi (429 yo\'q)', async ({ page }) => {
    const res = await page.request.post(`${BASE}/auth/register`, {
      data: {
        username: `apitest${TIMESTAMP}`,
        email: `apitest${TIMESTAMP}@example.com`,
        password: 'TestPass123',
      },
    });
    // 201 yoki 409 (duplicate) — 429 bo'lmasligi kerak
    expect([201, 409], `Status: ${res.status()}`).toContain(res.status());
  });
});
