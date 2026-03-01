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

  test('GET /api/v1/users/profile — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/profile');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/000000000000000000000001');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/users/profile — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/users/profile', {
      data: { bio: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/search — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/search?q=test');
    expect(res.status()).toBe(401);
  });
});
