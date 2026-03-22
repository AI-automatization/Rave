import { test, expect } from '@playwright/test';

/**
 * Battle Service API Tests
 * Production: https://battle-production-238a.up.railway.app
 * @api
 */

const FAKE_ID = '000000000000000000000001';
const INVALID_TOKEN = 'Bearer invalid.jwt.token';

test.describe('Battle Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Battle Service — Auth Guard @api', () => {
  test('POST /api/v1/battles — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/battles', {
      data: { opponentId: FAKE_ID, duration: 7 },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/battles/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/battles/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/battles/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.get(`/api/v1/battles/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/battles/:id/invite — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/battles/${FAKE_ID}/invite`, {
      data: { userId: FAKE_ID },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/battles/:id/accept — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/battles/${FAKE_ID}/accept`);
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/battles/:id/accept — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.put(`/api/v1/battles/${FAKE_ID}/accept`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/battles/:id/reject — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/battles/${FAKE_ID}/reject`);
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/battles/:id/reject — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.put(`/api/v1/battles/${FAKE_ID}/reject`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/battles/:id/leaderboard — token yo\'q → 401', async ({ request }) => {
    const res = await request.get(`/api/v1/battles/${FAKE_ID}/leaderboard`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Battle Service — Internal Endpoints @api', () => {
  test('GET /api/v1/battles/internal/admin/stats — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/battles/internal/admin/stats');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/battles/internal/admin/list — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/battles/internal/admin/list');
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/battles/internal/admin/:id/end — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post(`/api/v1/battles/internal/admin/${FAKE_ID}/end`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/battles/internal/admin/:id/cancel — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post(`/api/v1/battles/internal/admin/${FAKE_ID}/cancel`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/battles/internal/user-stats/:userId — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get(`/api/v1/battles/internal/user-stats/${FAKE_ID}`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Battle Service — Invalid Token @api', () => {
  test('GET /api/v1/battles/me — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/battles/me', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/battles — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.post('/api/v1/battles', {
      headers: { Authorization: INVALID_TOKEN },
      data: { opponentId: FAKE_ID, duration: 3 },
    });
    expect(res.status()).toBe(401);
  });
});
