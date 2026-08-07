import { test, expect } from '@playwright/test';

test.describe('Public Pages — ochiq sahifalar', () => {

  test('Landing page (/) yuklanadi va tugmalar/havolalar bor', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    // Kamida bitta CTA tugma yoki havola bo'lishi kerak
    const cta = page.locator('a, button').first();
    await expect(cta).toBeVisible({ timeout: 10000 });
  });

  test('/login marketing saytidan app domeniga redirect qiladi', async ({ request }) => {
    const response = await request.get('/login', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe('https://app.wewatch.uz/login');
  });

  test('/register marketing saytidan app domeniga redirect qiladi', async ({ request }) => {
    const response = await request.get('/register', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe('https://app.wewatch.uz/register');
  });

  test('/features sahifasi yuklanadi', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/features');
    await expect(page).toHaveTitle(/.+/);
    // Sahifa 404 bo'lmasligi kerak
    const content = page.locator('body');
    await expect(content).toBeVisible();
    const notFound = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
    expect(notFound, '/features sahifasi 404 qaytardi').toBe(false);
  });

  test('/pricing sahifasi yuklanadi', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/.+/);
    // Sahifa 404 bo'lmasligi kerak
    const notFound = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
    expect(notFound, '/pricing sahifasi 404 qaytardi').toBe(false);
  });

  test('Root URL — HTTP 200 status', async ({ page }) => {
    test.setTimeout(60000);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

});
