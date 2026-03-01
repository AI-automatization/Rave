import { test, expect } from '@playwright/test';

/**
 * Notification Service API Tests
 * Base URL: http://localhost:3007
 * @api
 *
 * NOTE: Servis Firebase FCM credentials talab qiladi.
 * Placeholder key bilan servis start bo'lmaydi → testlar skip.
 * Fix: services/notification/.env ga real FIREBASE_PRIVATE_KEY qo'yish kerak.
 */

test.describe('Notification Service @smoke @api', () => {
  test.skip('GET /health — servis ishlayapti', async ({ request }) => {
    // SKIP: Firebase FCM invalid credential — servis crash bo'lyapti (T-S016)
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test.skip('GET /api/v1/notifications — token yo\'q → 401', async ({ request }) => {
    // SKIP: Firebase FCM invalid credential — servis crash bo'lyapti (T-S016)
    const res = await request.get('/api/v1/notifications');
    expect(res.status()).toBe(401);
  });

  test.skip('PATCH /api/v1/notifications/:id/read — token yo\'q → 401', async ({ request }) => {
    // SKIP: Firebase FCM invalid credential — servis crash bo'lyapti (T-S016)
    const res = await request.patch('/api/v1/notifications/000000000000000000000001/read');
    expect(res.status()).toBe(401);
  });

  test.skip('DELETE /api/v1/notifications/:id — token yo\'q → 401', async ({ request }) => {
    // SKIP: Firebase FCM invalid credential — servis crash bo'lyapti (T-S016)
    const res = await request.delete('/api/v1/notifications/000000000000000000000001');
    expect(res.status()).toBe(401);
  });
});
