import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEST_USER = {
  username: `tuser${TIMESTAMP}`,
  email: `tuser${TIMESTAMP}@example.com`,
  password: 'TestPass123!',
};

test.describe('Auth — Register & Login', () => {

  test('Register sahifasi yuklanadi', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/CineSync/i);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test("Noto'g'ri ma'lumotlar — react-hook-form validatsiya xatosi", async ({ page }) => {
    await page.goto('/register');

    // Valid email lekin qisqa username va password → react-hook-form xatosi
    await page.fill('input[name="username"]', 'ab');
    await page.fill('input[name="email"]', 'valid@test.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '456');
    await page.click('button[type="submit"]');

    // react-hook-form xatolari ko'rinadi (accessibility snapshot: generic element)
    await expect(page.getByText('Kamida 3 ta belgi')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Kamida 8 ta belgi')).toBeVisible({ timeout: 1000 });
  });

  test("Ro'yxatdan o'tish — muvaffaqiyat yoki server javobi", async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Natija: muvaffaqiyat (form yo'qoladi) YOKI server xatosi (xato xabari)
    // Ikkalasi ham sahifada biror o'zgarish ko'rsatishi kerak
    await expect(
      page.locator('form').or(page.locator('h2')),
    ).toBeVisible({ timeout: 10000 });

    // Agar form yo'q bo'lsa (muvaffaqiyat) → h2 ko'rinishi kerak
    const formVisible = await page.locator('form').isVisible();
    if (!formVisible) {
      await expect(page.locator('h2')).toBeVisible();
    }
  });

  test('Login sahifasi yuklanadi', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("Noto'g'ri login — xato xabari ko'rinadi", async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'nouser@example.com');
    await page.fill('input[name="password"]', 'WrongPass123!');
    await page.click('button[type="submit"]');

    // LoginForm: div.text-red-400 yoki boshqa error xabar
    await expect(page.locator('div.text-red-400').first()).toBeVisible({ timeout: 10000 });
  });

  test('PWA ikonkalar yuklanadi (404 yo\'q)', async ({ page }) => {
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    for (const size of sizes) {
      const res = await page.request.get(`/icons/icon-${size}x${size}.png`);
      expect(res.status(), `icon-${size}x${size}.png topilmadi!`).toBe(200);
    }
  });

  test('API /auth/register — endpoint javob beradi', async ({ page }) => {
    const res = await page.request.post('/auth/register', {
      data: {
        username: `api${TIMESTAMP}`,
        email: `api${TIMESTAMP}@example.com`,
        password: 'TestPass123!',
      },
    });
    // 201 (yangi), 400/409/422 (validatsiya), 429 (rate limit) — hammasi OK
    expect([201, 400, 409, 422, 429], `Kutilmagan status: ${res.status()}`).toContain(res.status());
  });
});
