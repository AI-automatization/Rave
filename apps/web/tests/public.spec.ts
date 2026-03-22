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

  test('/login sahifasi yuklanadi va form elementlari bor', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/login');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('/register sahifasi yuklanadi va form elementlari bor', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/register');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
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
