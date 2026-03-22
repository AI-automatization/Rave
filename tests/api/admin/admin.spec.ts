import { test, expect } from '@playwright/test';

/**
 * Admin Service API Tests
 * Production: https://admin-production-8d2a.up.railway.app
 * @api
 */

const FAKE_ID = '000000000000000000000001';
const INVALID_TOKEN = 'Bearer invalid.jwt.token';

test.describe('Admin Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Admin Service — Auth Guard (Dashboard) @api', () => {
  test('GET /api/v1/admin/dashboard — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/dashboard');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/analytics — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/analytics');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/system/health — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/system/health');
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Auth Guard (Users) @api', () => {
  test('GET /api/v1/admin/users — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/users');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/admin/users/:id/block — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/admin/users/${FAKE_ID}/block`, {
      data: { reason: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/admin/users/:id/unblock — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/admin/users/${FAKE_ID}/unblock`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/admin/users/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/admin/users/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Auth Guard (Content) @api', () => {
  test('GET /api/v1/admin/movies — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/movies');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/admin/movies/:id/publish — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/admin/movies/${FAKE_ID}/publish`);
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/admin/movies/:id/unpublish — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/admin/movies/${FAKE_ID}/unpublish`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/admin/movies/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/admin/movies/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Auth Guard (Battles & WatchParty) @api', () => {
  test('GET /api/v1/admin/battles — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/battles');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/admin/battles/:id/end — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/admin/battles/${FAKE_ID}/end`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/admin/battles/:id/cancel — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/admin/battles/${FAKE_ID}/cancel`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/watchparties — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/watchparties');
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/admin/watchparties/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/admin/watchparties/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/admin/watchparties/:id/members/:userId — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/admin/watchparties/${FAKE_ID}/members/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Auth Guard (Logs & Feedback) @api', () => {
  test('GET /api/v1/admin/logs — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/logs');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/audit-logs — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/audit-logs');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/feedback — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/feedback');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/admin/feedback/:id/reply — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/admin/feedback/${FAKE_ID}/reply`, {
      data: { reply: 'test reply' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Auth Guard (Staff & Notifications) @api', () => {
  test('GET /api/v1/admin/staff — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/staff');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/admin/staff — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/admin/staff', {
      data: { email: 'staff@test.com', role: 'admin' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/admin/staff/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/admin/staff/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/admin/notifications/broadcast — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/admin/notifications/broadcast', {
      data: { title: 'Test', body: 'Test broadcast' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Admin Service — Invalid Token @api', () => {
  test('GET /api/v1/admin/dashboard — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/dashboard', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/users — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/admin/users', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });
});
