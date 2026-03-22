import { test, expect } from '@playwright/test';

/**
 * User Service API Tests
 * Production: https://user-production-86ed.up.railway.app
 * @api
 */

const FAKE_ID = '000000000000000000000001';
const INVALID_TOKEN = 'Bearer invalid.jwt.token';

test.describe('User Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('User Service — Public Endpoints @api', () => {
  test('GET /api/v1/users/:id — mavjud bo\'lmagan ID → 404', async ({ request }) => {
    const res = await request.get(`/api/v1/users/${FAKE_ID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/users/:id — noto\'g\'ri ID format → 400/404/422', async ({ request }) => {
    const res = await request.get('/api/v1/users/not-a-valid-id');
    expect([400, 404, 422]).toContain(res.status());
  });
});

test.describe('User Service — Auth Guard (Profile) @api', () => {
  test('GET /api/v1/users/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/users/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/users/me', {
      data: { bio: 'test bio' },
    });
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/users/me — mobile alias, token yo\'q → 401', async ({ request }) => {
    const res = await request.put('/api/v1/users/me', {
      data: { bio: 'test bio' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/users/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete('/api/v1/users/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/me/stats — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/stats');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/me/achievements — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/achievements');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/me/settings — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/settings');
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/users/me/settings — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch('/api/v1/users/me/settings', {
      data: { language: 'uz' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('User Service — Auth Guard (Friends) @api', () => {
  test('GET /api/v1/users/me/friends — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/friends');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/friends — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/friends');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/me/friend-requests — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me/friend-requests');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/users/friends/requests — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/friends/requests');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/users/friends/request — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/users/friends/request', {
      data: { receiverId: FAKE_ID },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/users/friends/:receiverId — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/users/friends/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/users/friends/accept/:friendshipId — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/users/friends/accept/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/users/me/friends/:userId — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/users/me/friends/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('User Service — FCM & Heartbeat @api', () => {
  test('POST /api/v1/users/me/fcm-token — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/users/me/fcm-token', {
      data: { token: 'fcm-test-token' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/users/me/fcm-token — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete('/api/v1/users/me/fcm-token');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/users/heartbeat — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/users/heartbeat');
    expect(res.status()).toBe(401);
  });
});

test.describe('User Service — Invalid Token @api', () => {
  test('GET /api/v1/users/me — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/users/me', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });
});
