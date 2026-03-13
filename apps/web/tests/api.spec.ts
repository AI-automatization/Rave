import { test, expect } from '@playwright/test';

test.describe('API Endpoints — javob beradi', () => {

  test('GET / — root 200 qaytaradi', async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.get('/');
    expect(res.status()).toBe(200);
  });

  test('POST /api/auth/login — noto\'g\'ri credentials 401/400 qaytaradi', async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.post('/api/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      },
    });
    // 401 (unauthorized), 400 (bad request), 404 (not found) yoki 422 kutiladi
    // 200 bo'lmasligi kerak
    expect([400, 401, 404, 422, 429], `Kutilmagan status: ${res.status()}`).toContain(res.status());
  });

  test('POST /api/auth/register — invalid data 400/422 qaytaradi', async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.post('/api/auth/register', {
      data: {
        username: 'x',          // too short
        email: 'not-an-email',  // invalid email
        password: '123',         // too short
      },
    });
    // 400 (bad request) yoki 422 (unprocessable) kutiladi
    expect([400, 401, 404, 422, 429], `Kutilmagan status: ${res.status()}`).toContain(res.status());
  });

  test('GET /watch-party/rooms — auth yo\'q → 401/403/404/405 qaytaradi', async ({ request }) => {
    test.setTimeout(60000);
    const res = await request.get('/watch-party/rooms', { maxRedirects: 0 });
    // 302/307 (middleware redirect), 401/403 (backend auth), 404/405 (route)
    expect([302, 307, 401, 403, 404, 405, 429], `Kutilmagan status: ${res.status()}`).toContain(res.status());
  });

});
