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

  test('GET /api/v1/content/movies — public list → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies');
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/content/movies/:id — mavjud bo\'lmagan ID → 404', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies/000000000000000000000001');
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/content/movies/search — query parametri → 200', async ({ request }) => {
    const res = await request.get('/api/v1/content/movies/search?q=avengers');
    expect(res.status()).toBe(200);
  });

  test('POST /api/v1/content/movies — token yo\'q → 401', async ({ request }) => {
    const res = await request.post('/api/v1/content/movies', {
      data: { title: 'Test Movie' },
    });
    expect(res.status()).toBe(401);
  });
});
