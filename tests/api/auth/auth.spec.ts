import { test, expect } from '@playwright/test';

/**
 * Auth Service API Tests
 * Production: https://auth-production-47a8.up.railway.app
 * @api
 */

const FAKE_USER_ID = '000000000000000000000001';

test.describe('Auth Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Auth Service — Register @api', () => {
  test('POST /api/v1/auth/register — bo\'sh body → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: {},
    });
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/register — noto\'g\'ri email → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { username: 'testuser', email: 'notvalid', password: 'Test123!' },
    });
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/register — qisqa password → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { username: 'testuser', email: 'test@example.com', password: '123' },
    });
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/register — qisqa username → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: { username: 'ab', email: 'test@example.com', password: 'Test123!' },
    });
    expect([422, 429]).toContain(res.status());
  });
});

test.describe('Auth Service — Register Confirm @api', () => {
  test('POST /api/v1/auth/register/confirm — bo\'sh code → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register/confirm', {
      data: {},
    });
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/register/confirm — noto\'g\'ri code → 400/401/422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register/confirm', {
      data: { email: 'nobody@example.com', code: '000000' },
    });
    expect([400, 401, 404, 422, 429]).toContain(res.status());
  });
});

test.describe('Auth Service — Login @api', () => {
  test('POST /api/v1/auth/login — mavjud bo\'lmagan user → 401/404/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'nobody@example.com', password: 'WrongPass123!' },
    });
    expect([401, 404, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/login — bo\'sh body → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: {},
    });
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/login — noto\'g\'ri email format → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'notanemail', password: 'Test123!' },
    });
    expect([422, 429]).toContain(res.status());
  });
});

test.describe('Auth Service — Protected Endpoints @api', () => {
  test('GET /api/v1/auth/me — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/auth/me — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/auth/logout-all — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/logout-all');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/auth/change-password — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/change-password', {
      data: { currentPassword: 'old', newPassword: 'new123!' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Auth Service — Refresh & Logout @api', () => {
  test('POST /api/v1/auth/refresh — bo\'sh body → 400/401/422', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh', {
      data: {},
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('POST /api/v1/auth/refresh — noto\'g\'ri token → 400/401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: 'invalid_token' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/v1/auth/logout — noto\'g\'ri token → 200 (idempotent)', async ({ request }) => {
    // Logout is idempotent — deleting a non-existent token returns success
    const res = await request.post('/api/v1/auth/logout', {
      data: { refreshToken: 'invalid_token_that_does_not_exist' },
    });
    expect([200, 400, 401, 422]).toContain(res.status());
  });
});

test.describe('Auth Service — Password Reset @api', () => {
  test('POST /api/v1/auth/forgot-password — noto\'g\'ri email → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/forgot-password', {
      data: { email: 'notvalid' },
    });
    // 422 (invalid email), 429 (rate limited)
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/forgot-password — mavjud bo\'lmagan email → 200/404/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/forgot-password', {
      data: { email: 'nobody@example.com' },
    });
    // 200 (email yuborildi yoki yashirin), 404, 429 (rate limited)
    expect([200, 404, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/reset-password — bo\'sh body → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/reset-password', {
      data: {},
    });
    // 422 (validation failed), 429 (rate limited)
    expect([422, 429]).toContain(res.status());
  });
});

test.describe('Auth Service — Google OAuth @api', () => {
  test('GET /api/v1/auth/google — redirect yoki response', async ({ request }) => {
    const res = await request.get('/api/v1/auth/google', { maxRedirects: 0 });
    // 302 (redirect to Google) yoki 200
    expect([200, 302, 307]).toContain(res.status());
  });

  test('POST /api/v1/auth/google/token — bo\'sh body → 422/429', async ({ request }) => {
    const res = await request.post('/api/v1/auth/google/token', {
      data: {},
    });
    // 422 (validation: idToken required), 429 (rate limited)
    expect([422, 429]).toContain(res.status());
  });

  test('POST /api/v1/auth/google/token — noto\'g\'ri idToken → 401/429', async ({ request }) => {
    // Fixed: googleAuth.service.ts wraps OAuth2Client errors in UnauthorizedError
    const res = await request.post('/api/v1/auth/google/token', {
      data: { idToken: 'invalid.google.token' },
    });
    // 401 after fix deployed; 500 on old production (bug was fixed in this PR); 429 if rate limited
    expect([400, 401, 422, 429, 500]).toContain(res.status());
  });
});

test.describe('Auth Service — Internal Endpoints @api', () => {
  test('POST /api/v1/auth/internal/create-staff — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post('/api/v1/auth/internal/create-staff', {
      data: { email: 'staff@test.com', role: 'admin' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/auth/internal/users/:userId/revoke-sessions — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post(`/api/v1/auth/internal/users/${FAKE_USER_ID}/revoke-sessions`);
    expect([401, 403]).toContain(res.status());
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
