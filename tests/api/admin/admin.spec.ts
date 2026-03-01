import { test, expect } from '@playwright/test';

/**
 * Admin Service API Tests
 * Base URL: http://localhost:3008
 * @api
 */

test.describe('Admin Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/admin/users — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/users');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/stats — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/stats');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/admin/content — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/admin/content', {
      data: { title: 'Test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/logs — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/logs');
    expect(res.status()).toBe(401);
  });
});
