import { test, expect } from '@playwright/test';

/**
 * Watch Party Service API Tests
 * Production: https://watch-part-production.up.railway.app
 * @api
 */

const FAKE_ROOM_ID = 'test-room-id-000001';
const FAKE_INVITE_CODE = 'ABCDEF';
const FAKE_USER_ID = '000000000000000000000001';
const INVALID_TOKEN = 'Bearer invalid.jwt.token';

test.describe('Watch Party Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Watch Party Service — Auth Guard @api', () => {
  test('GET /api/v1/watch-party/rooms — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/watch-party/rooms');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/watch-party/rooms', {
      data: { movieId: FAKE_USER_ID, title: 'Test Room' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/watch-party/rooms/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.get(`/api/v1/watch-party/rooms/${FAKE_ROOM_ID}`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms/join/:inviteCode — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/watch-party/rooms/join/${FAKE_INVITE_CODE}`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/join/:inviteCode — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/watch-party/join/${FAKE_INVITE_CODE}`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/watch-party/rooms/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/watch-party/rooms/${FAKE_ROOM_ID}`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/watch-party/rooms/:id/leave — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/watch-party/rooms/${FAKE_ROOM_ID}/leave`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms/:id/leave — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/watch-party/rooms/${FAKE_ROOM_ID}/leave`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms/:id/invite — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/watch-party/rooms/${FAKE_ROOM_ID}/invite`, {
      data: { userId: FAKE_USER_ID },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Watch Party Service — Internal Endpoints @api', () => {
  test('GET /api/v1/watch-party/internal/admin/stats — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/watch-party/internal/admin/stats');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/watch-party/internal/admin/list — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/watch-party/internal/admin/list');
    expect([401, 403]).toContain(res.status());
  });

  test('DELETE /api/v1/watch-party/internal/admin/:id — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.delete(`/api/v1/watch-party/internal/admin/${FAKE_ROOM_ID}`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/watch-party/internal/users/:userId/disconnect — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post(`/api/v1/watch-party/internal/users/${FAKE_USER_ID}/disconnect`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Watch Party Service — Invalid Token @api', () => {
  test('GET /api/v1/watch-party/rooms — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/watch-party/rooms', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/watch-party/rooms — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.post('/api/v1/watch-party/rooms', {
      headers: { Authorization: INVALID_TOKEN },
      data: { movieId: FAKE_USER_ID },
    });
    expect(res.status()).toBe(401);
  });
});
