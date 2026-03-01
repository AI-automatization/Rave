import { test, expect } from '@playwright/test';

/**
 * Battle Service API Tests
 * Base URL: http://localhost:3005
 * @api
 */

test.describe('Battle Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('POST /api/v1/battles — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/battles', {
      data: { opponentId: '000000000000000000000001', duration: 7 },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/battles/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/battles/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/battles/:id/leaderboard — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/battles/000000000000000000000001/leaderboard');
    expect(res.status()).toBe(401);
  });
});
