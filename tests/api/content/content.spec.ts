import { test, expect } from '@playwright/test';

/**
 * Content Service API Tests
 * Production: https://content-production-4e08.up.railway.app
 * @api
 */

const FAKE_ID = '000000000000000000000001';
const FAKE_RATING_ID = '000000000000000000000002';
const INVALID_TOKEN = 'Bearer invalid.jwt.token';

test.describe('Content Service — Health @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty('status');
  });
});

test.describe('Content Service — Public Endpoints @api', () => {
  test('GET /api/v1/content/movies — public list → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/movies — pagination params → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies?page=1&limit=10');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/movies/:id — mavjud bo\'lmagan ID → 404', async ({ request }) => {
    const res = await request.get(`/api/v1/content/movies/${FAKE_ID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/content/movies/search — query → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies/search?q=avengers');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/search — query → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/search?q=film');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/trending — public → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/trending');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/top-rated — public → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/top-rated');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/movies/:id/ratings — public → 200/404', async ({ request }) => {
    const res = await request.get(`/api/v1/content/movies/${FAKE_ID}/ratings`);
    expect([200, 404]).toContain(res.status());
  });
});

test.describe('Content Service — Auth Guard (Write) @api', () => {
  test('POST /api/v1/content/movies — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/movies', {
      data: { title: 'Test Movie', description: 'test', genre: ['Action'] },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/content/movies/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.patch(`/api/v1/content/movies/${FAKE_ID}`, {
      data: { title: 'Updated Title' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/content/movies/:id — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/content/movies/${FAKE_ID}`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Content Service — Auth Guard (User Actions) @api', () => {
  test('POST /api/v1/content/movies/:id/rate — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/content/movies/${FAKE_ID}/rate`, {
      data: { rating: 8 },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/content/movies/:id/rate — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/content/movies/${FAKE_ID}/rate`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/content/ratings/:ratingId — token yo\'q → 401', async ({ request }) => {
    const res = await request.delete(`/api/v1/content/ratings/${FAKE_RATING_ID}`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/content/history — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/content/history');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/content/history — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/history', {
      data: { movieId: FAKE_ID, watchedAt: new Date().toISOString() },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/content/continue-watching — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/content/continue-watching');
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/content/movies/:id/progress — token yo\'q → 401', async ({ request }) => {
    const res = await request.get(`/api/v1/content/movies/${FAKE_ID}/progress`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/content/movies/:id/progress — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/content/movies/${FAKE_ID}/progress`, {
      data: { position: 120, duration: 3600 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/content/movies/:id/complete — token yo\'q → 401', async ({ request }) => {
    const res = await request.post(`/api/v1/content/movies/${FAKE_ID}/complete`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/content/extract — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/extract', {
      data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Content Service — Auth Guard (Stats) @api', () => {
  test('GET /api/v1/content/movies/stats — token yo\'q → 401', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies/stats');
    expect(res.status()).toBe(401);
  });
});

test.describe('Content Service — Internal Endpoints @api', () => {
  test('GET /api/v1/content/internal/admin/movies — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/content/internal/admin/movies');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/v1/content/internal/admin/stats — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.get('/api/v1/content/internal/admin/stats');
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/v1/content/internal/admin/movies/:id/publish — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.post(`/api/v1/content/internal/admin/movies/${FAKE_ID}/publish`);
    expect([401, 403]).toContain(res.status());
  });

  test('DELETE /api/v1/content/internal/admin/movies/:id — secret yo\'q → 401/403', async ({ request }) => {
    const res = await request.delete(`/api/v1/content/internal/admin/movies/${FAKE_ID}`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Content Service — Invalid Token @api', () => {
  test('POST /api/v1/content/movies — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/movies', {
      headers: { Authorization: INVALID_TOKEN },
      data: { title: 'Test', description: 'test', genre: ['Action'] },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/content/history — noto\'g\'ri token → 401', async ({ request }) => {
    const res = await request.get('/api/v1/content/history', {
      headers: { Authorization: INVALID_TOKEN },
    });
    expect(res.status()).toBe(401);
  });
});
