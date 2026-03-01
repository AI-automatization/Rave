import { test, expect } from '@playwright/test';

/**
 * User Service API Tests
 * Base URL: http://localhost:3002
 * @api
 */

test.describe('User Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/users/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/:id — public route, mavjud bo\'lmagan ID → 404', async ({ request }) => {
    const res = await request.get('/api/v1/users/000000000000000000000001');
    expect(res.status()).toBe(404);
  });

  test('PATCH /api/v1/users/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/users/me', {
      data: { bio: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/me/friends — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/friends');
    expect(res.status()).toBe(401);
  });
});
