import { test, expect } from '@playwright/test';

/**
 * Notification Service API Tests
 * Production: https://notification-production-9c30.up.railway.app
 * @api
 */

const FAKE_ID = '000000000000000000000001';

test.describe('Notification Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Notification Service — Auth Guard @api', () => {
  test('GET /api/v1/notifications — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/notifications/unread-count — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications/unread-count');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/notifications/read-all — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/notifications/read-all');
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/notifications/read-all — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.put('/api/v1/notifications/read-all');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/notifications/:id/read — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/notifications/${FAKE_ID}/read`);
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/notifications/:id/read — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.put(`/api/v1/notifications/${FAKE_ID}/read`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/notifications/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/notifications/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Notification Service — Internal Endpoints @api', () => {
  test('POST /api/v1/notifications/internal/send — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post('/api/v1/notifications/internal/send', {
      data: { userId: FAKE_ID, type: 'system', title: 'Test', body: 'Test' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/notifications/internal/send — noto\'g\'ri secret → 401/403', async ({ request }) => {
    const res = await request.post('/api/v1/notifications/internal/send', {
      headers: { 'x-internal-secret': 'wrong-secret' },
      data: { userId: FAKE_ID, type: 'system', title: 'Test', body: 'Test' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/notifications/internal/admin/broadcast — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post('/api/v1/notifications/internal/admin/broadcast', {
      data: { type: 'announcement', title: 'Test broadcast', body: 'Test' },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Notification Service — Invalid Token @api', () => {
  const INVALID_TOKEN = 'Bearer invalid.jwt.token';

  test('GET /api/v1/notifications — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/notifications/unread-count — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/notifications/unread-count', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });
});
