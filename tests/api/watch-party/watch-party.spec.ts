import { test, expect } from '@playwright/test';

/**
 * Watch Party Service API Tests
 * Base URL: http://localhost:3004
 * @api
 */

test.describe('Watch Party Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('POST /api/v1/watch-party/rooms — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/watch-party/rooms', {
      data: { movieId: '000000000000000000000001' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/watch-party/rooms/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/watch-party/rooms/test-room-id');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms/:id/join — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/watch-party/rooms/test-room-id/join');
    expect(res.status()).toBe(401);
  });
});
