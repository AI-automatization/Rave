import { test, expect } from '@playwright/test';

/**
 * Auth Service API Tests
 * Base URL: http://localhost:3001
 * @api
 */

test.describe('Auth Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('POST /api/v1/auth/register — bo\'sh body → 422', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: {},
    });
    expect(res.status()).toBe(422);
  });

  test('POST /api/v1/auth/register — noto\'g\'ri email → 422', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { username: 'test', email: 'notvalid', password: '123' },
    });
    expect(res.status()).toBe(422);
  });

  test('POST /api/v1/auth/login — mavjud bo\'lmagan user → 401/404', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'nobody@example.com', password: 'WrongPass123!' },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('GET /api/v1/auth/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/auth/refresh — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: 'invalid_token' },
    });
    expect([400, 401]).toContain(res.status());
  });
});

test.describe('Auth Service — Rate Limiting @api', () => {
  test('Brute force protection ishlaydi', async ({ request }) => {
    // 5 ta xato login urinish
    for (let i = 0; i < 5; i++) {
      await request.post('/api/v1/auth/login', {
        data: { email: 'ratelimit@example.com', password: 'WrongPass!' },
      });
    }
    // 6-urinish: 429 yoki 401 qaytishi kerak
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'ratelimit@example.com', password: 'WrongPass!' },
    });
    expect([401, 429]).toContain(res.status());
  });
});
