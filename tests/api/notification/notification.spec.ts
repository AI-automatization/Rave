import { test, expect } from '@playwright/test';

/**
 * Notification Service API Tests
 * Production: https://notification-production-9c30.up.railway.app
 * @api
 */

test.describe('Notification Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/notifications — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/notifications/:id/read — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/notifications/000000000000000000000001/read');
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/notifications/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete('/api/v1/notifications/000000000000000000000001');
    expect(res.status()).toBe(401);
  });
});
