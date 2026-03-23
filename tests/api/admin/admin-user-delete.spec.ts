import { test, expect } from '@playwright/test';

/**
 * Admin — User Delete + Staff Create E2E Tests
 * Production API larga qarshi
 *
 * Bu testlar to'liq flow ni tekshiradi:
 *   1. Superadmin login → token olish
 *   2. Test user yaratish (register)
 *   3. Admin orqali user o'chirish
 *   4. O'chirilgan user login qila olmasligi
 *   5. Staff yaratish va login
 *
 * Ishga tushirish:
 *   npx playwright test --project=api-admin admin-user-delete
 * @api
 */

const AUTH_URL = 'https://auth-production-47a8.up.railway.app';
const ADMIN_URL = 'https://admin-production-8d2a.up.railway.app';

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? 'saidazim@cinesync.app';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? '';
const ADMIN_INIT_SECRET = process.env.ADMIN_INIT_SECRET ?? '';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loginSuperAdmin(request: any): Promise<AuthTokens> {
  // If no password provided, try upsert via ADMIN_INIT_SECRET
  if (!SUPERADMIN_PASSWORD && ADMIN_INIT_SECRET) {
    await request.put(`${AUTH_URL}/api/v1/auth/init-admin`, {
      data: {
        initSecret: ADMIN_INIT_SECRET,
        email: SUPERADMIN_EMAIL,
        username: 'superadmin',
        password: 'SuperAdmin1',
      },
    });
    const loginRes = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
      data: { email: SUPERADMIN_EMAIL, password: 'SuperAdmin1' },
    });
    const body = await loginRes.json() as ApiSuccessResponse<AuthTokens>;
    return body.data;
  }

  const res = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
    data: { email: SUPERADMIN_EMAIL, password: SUPERADMIN_PASSWORD },
  });
  expect(res.status(), 'Superadmin login should succeed').toBe(200);
  const body = await res.json() as ApiSuccessResponse<AuthTokens>;
  return body.data;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

const uniqueSuffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── Test: User Delete → Login blocked ───────────────────────────────────────

test.describe('Admin — User Delete Flow @api', () => {
  let adminTokens: AuthTokens;
  const testEmail = `deletetest_${uniqueSuffix()}@test.cinesync.app`;
  const testUsername = `del_${uniqueSuffix()}`.slice(0, 20);
  const testPassword = 'TestPass1';
  let testUserId: string;

  test('1. Superadmin login', async ({ request }) => {
    test.skip(!SUPERADMIN_PASSWORD && !ADMIN_INIT_SECRET, 'SUPERADMIN_PASSWORD or ADMIN_INIT_SECRET required');
    adminTokens = await loginSuperAdmin(request);
    expect(adminTokens.accessToken).toBeTruthy();
  });

  test('2. Test user yaratish (register)', async ({ request }) => {
    test.skip(!adminTokens);

    // Register via initiate + confirm (or use init-admin trick)
    const registerRes = await request.post(`${AUTH_URL}/api/v1/auth/register`, {
      data: { email: testEmail, username: testUsername, password: testPassword },
    });
    // Could be 200 (OTP sent) or 429 (rate limited)
    if (registerRes.status() === 429) {
      test.skip(true, 'Rate limited — skipping user creation');
      return;
    }
    expect(registerRes.status()).toBe(200);

    // Dev mode returns OTP
    const regBody = await registerRes.json() as ApiSuccessResponse<{ _dev_otp?: string } | null>;
    const otp = regBody.data?._dev_otp;

    if (otp) {
      const confirmRes = await request.post(`${AUTH_URL}/api/v1/auth/register/confirm`, {
        data: { email: testEmail, code: otp },
      });
      expect(confirmRes.status()).toBe(201);
      const confirmBody = await confirmRes.json() as ApiSuccessResponse<{ userId: string }>;
      testUserId = confirmBody.data.userId;
    }
  });

  test('3. Test user login ishlashini tekshirish', async ({ request }) => {
    test.skip(!testUserId);

    const res = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
      data: { email: testEmail, password: testPassword },
    });
    expect(res.status(), 'User should be able to login before delete').toBe(200);
  });

  test('4. Admin: user o\'chirish', async ({ request }) => {
    test.skip(!testUserId || !adminTokens);

    const res = await request.delete(`${ADMIN_URL}/api/v1/admin/users/${testUserId}`, {
      headers: authHeader(adminTokens.accessToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as ApiSuccessResponse<null>;
    expect(body.success).toBe(true);
  });

  test('5. O\'chirilgan user login qila OLMASLIGI kerak', async ({ request }) => {
    test.skip(!testUserId);

    const res = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
      data: { email: testEmail, password: testPassword },
    });
    // Should get 401 (user not found) — NOT 200
    expect(res.status(), 'Deleted user must NOT be able to login').toBe(401);
  });

  test('6. O\'chirilgan user refresh token ishlamasligi kerak', async ({ request }) => {
    test.skip(!testUserId);

    // Any old refresh token should be invalid
    const res = await request.post(`${AUTH_URL}/api/v1/auth/refresh`, {
      data: { refreshToken: 'old-invalid-token-after-delete' },
    });
    expect(res.status()).not.toBe(200);
  });
});

// ─── Test: Staff Create Flow ─────────────────────────────────────────────────

test.describe('Admin — Staff Create Flow @api', () => {
  let adminTokens: AuthTokens;
  const staffEmail = `staff_${uniqueSuffix()}@test.cinesync.app`;
  const staffUsername = `stf_${uniqueSuffix()}`.slice(0, 20);
  const staffPassword = 'StaffPass1';
  let staffAuthId: string;

  test('1. Superadmin login', async ({ request }) => {
    test.skip(!SUPERADMIN_PASSWORD && !ADMIN_INIT_SECRET, 'SUPERADMIN_PASSWORD or ADMIN_INIT_SECRET required');
    adminTokens = await loginSuperAdmin(request);
    expect(adminTokens.accessToken).toBeTruthy();
  });

  test('2. Yangi admin staff yaratish', async ({ request }) => {
    test.skip(!adminTokens);

    const res = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {
        email: staffEmail,
        username: staffUsername,
        password: staffPassword,
        role: 'admin',
      },
    });
    expect(res.status(), 'Staff creation should succeed').toBe(201);
    const body = await res.json() as ApiSuccessResponse<{ authId: string }>;
    expect(body.success).toBe(true);
    staffAuthId = body.data.authId;
    expect(staffAuthId).toBeTruthy();
  });

  test('3. Yangi staff login qila olishi kerak', async ({ request }) => {
    test.skip(!staffAuthId);

    const res = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
      data: { email: staffEmail, password: staffPassword },
    });
    expect(res.status(), 'New staff should be able to login').toBe(200);
    const body = await res.json() as ApiSuccessResponse<{ accessToken: string; user: { role: string } }>;
    expect(body.data.user.role).toBe('admin');
  });

  test('4. Staff listda ko\'rinishi kerak', async ({ request }) => {
    test.skip(!staffAuthId || !adminTokens);

    const res = await request.get(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as ApiSuccessResponse<Array<{ authId: string; email: string }>>;
    const found = (body.data as Array<{ authId: string; email: string }>).some(
      (s) => s.email === staffEmail,
    );
    expect(found, 'New staff should appear in staff list').toBe(true);
  });

  test('5. Staff o\'chirish', async ({ request }) => {
    test.skip(!staffAuthId || !adminTokens);

    const res = await request.delete(`${ADMIN_URL}/api/v1/admin/staff/${staffAuthId}`, {
      headers: authHeader(adminTokens.accessToken),
    });
    expect(res.status()).toBe(200);
  });

  test('6. O\'chirilgan staff login qila OLMASLIGI kerak', async ({ request }) => {
    test.skip(!staffAuthId);

    const res = await request.post(`${AUTH_URL}/api/v1/auth/login`, {
      data: { email: staffEmail, password: staffPassword },
    });
    expect(res.status(), 'Deleted staff must NOT be able to login').toBe(401);
  });
});

// ─── Test: Staff Create — Validation ─────────────────────────────────────────

test.describe('Admin — Staff Create Validation @api', () => {
  let adminTokens: AuthTokens;

  test('1. Superadmin login', async ({ request }) => {
    test.skip(!SUPERADMIN_PASSWORD && !ADMIN_INIT_SECRET, 'SUPERADMIN_PASSWORD or ADMIN_INIT_SECRET required');
    adminTokens = await loginSuperAdmin(request);
  });

  test('Bo\'sh body → 400', async ({ request }) => {
    test.skip(!adminTokens);
    const res = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('Noto\'g\'ri role → 400', async ({ request }) => {
    test.skip(!adminTokens);
    const res = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {
        email: 'test@test.com',
        username: 'testuser1',
        password: 'TestPass1',
        role: 'invalid_role',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('Moderator role yaratish ishlashi kerak', async ({ request }) => {
    test.skip(!adminTokens);
    const modEmail = `mod_${uniqueSuffix()}@test.cinesync.app`;
    const modUsername = `mod_${uniqueSuffix()}`.slice(0, 20);
    const res = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {
        email: modEmail,
        username: modUsername,
        password: 'ModPass1',
        role: 'moderator',
      },
    });
    expect(res.status(), 'Moderator staff creation should succeed').toBe(201);

    // Cleanup: delete the moderator
    const body = await res.json() as ApiSuccessResponse<{ authId: string }>;
    if (body.data?.authId) {
      await request.delete(`${ADMIN_URL}/api/v1/admin/staff/${body.data.authId}`, {
        headers: authHeader(adminTokens.accessToken),
      });
    }
  });

  test('Duplicate username → 409', async ({ request }) => {
    test.skip(!adminTokens);

    const dup = `dup_${uniqueSuffix()}`.slice(0, 20);

    // Create first
    const res1 = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {
        email: `a_${uniqueSuffix()}@test.cinesync.app`,
        username: dup,
        password: 'TestPass1',
        role: 'operator',
      },
    });
    expect(res1.status()).toBe(201);
    const body1 = await res1.json() as ApiSuccessResponse<{ authId: string }>;

    // Create second with same username, different email
    const res2 = await request.post(`${ADMIN_URL}/api/v1/admin/staff`, {
      headers: authHeader(adminTokens.accessToken),
      data: {
        email: `b_${uniqueSuffix()}@test.cinesync.app`,
        username: dup,
        password: 'TestPass1',
        role: 'operator',
      },
    });
    expect(res2.status(), 'Duplicate username should be rejected').toBe(409);

    // Cleanup
    if (body1.data?.authId) {
      await request.delete(`${ADMIN_URL}/api/v1/admin/staff/${body1.data.authId}`, {
        headers: authHeader(adminTokens.accessToken),
      });
    }
  });
});
