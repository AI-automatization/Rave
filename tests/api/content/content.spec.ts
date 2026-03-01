import { test, expect } from '@playwright/test';

/**
 * Content Service API Tests
 * Base URL: http://localhost:3003
 * @api
 */

test.describe('Content Service @smoke @api', () => {
  test('GET /health — servis ishlayapti', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/movies — public list', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies');
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/v1/content/movies/:id — mavjud bo\'lmagan ID', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies/000000000000000000000001');
    expect([401, 404]).toContain(res.status());
  });

  test('GET /api/v1/content/search — query parametri', async ({ request }) => {
    const res = await request.get('/api/v1/content/search?q=avengers');
    expect([200, 401]).toContain(res.status());
  });

  test('POST /api/v1/content/movies — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/movies', {
      data: { title: 'Test Movie' },
    });
    expect(res.status()).toBe(401);
  });
});
