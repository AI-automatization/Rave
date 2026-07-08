/**
 * Video playback E2E — production wewatch.uz
 * Full flow: login → /home → create room → play HLS → verify currentTime > 0
 * VK extraction is tested separately — yt-dlp needs VK session cookies on Railway.
 */
import { test, expect } from '@playwright/test';

const PROD = 'https://www.wewatch.uz';
// Public Apple HLS test stream (no auth required, always available)
const TEST_HLS = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';
const TEST_EMAIL = 'pw1781607165@test.com';
const TEST_PASS = 'TestPass123!';

test.use({ headless: true, screenshot: 'on', video: 'on', actionTimeout: 20_000 });

test('HLS video plays in watch party room', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const failedReqs: string[] = [];
  page.on('requestfailed', r => failedReqs.push(`${r.method()} ${r.url().slice(0, 120)}`));

  // ── 1. Login ────────────────────────────────────────────────────────────────
  await page.goto(PROD, { waitUntil: 'domcontentloaded' });
  const loginRes = await page.evaluate(async (creds) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(creds),
    });
    const body = await r.json();
    return { ok: r.ok, status: r.status, user: (body as any)?.data?.user?.username };
  }, { email: TEST_EMAIL, password: TEST_PASS });

  console.log('Login:', loginRes);
  expect(loginRes.ok, 'Login must succeed').toBe(true);

  // ── 2. Home ──────────────────────────────────────────────────────────────────
  await page.goto(`${PROD}/home`, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: 'test-results/01-home.png' });
  console.log('Home URL:', page.url());
  expect(page.url()).toContain('/home');

  // ── 3. Create room with direct HLS URL ──────────────────────────────────────
  const roomRes = await page.evaluate(async (videoUrl) => {
    const r = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: 'pw-hls-test', isPrivate: false, videoUrl }),
    });
    const body = await r.json();
    return { ok: r.ok, status: r.status, body };
  }, TEST_HLS);
  console.log('Create room:', JSON.stringify(roomRes).slice(0, 200));
  expect(roomRes.ok, 'Room creation must succeed').toBe(true);

  const roomId = (roomRes.body as any)?.data?._id;
  expect(roomId, 'Room ID must be returned').toBeTruthy();

  // ── 4. Open room ─────────────────────────────────────────────────────────────
  await page.goto(`${PROD}/room/${roomId}`, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: 'test-results/02-room.png' });
  console.log('Room URL:', page.url());

  // ── 5. Verify generic HLS extraction ─────────────────────────────────────────
  const extractRes = await page.evaluate(async (url) => {
    const r = await fetch('/api/content/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url }),
    });
    const body = await r.json();
    return { ok: r.ok, status: r.status, body };
  }, TEST_HLS);

  console.log('\n═══ HLS EXTRACT ═══');
  console.log('Status:', extractRes.status);
  const d = (extractRes.body as any)?.data;
  console.log('Type:', d?.type);
  console.log('URL:', (d?.videoUrl || '').slice(0, 100));
  expect(extractRes.ok, `HLS extraction must return 200 (got ${extractRes.status})`).toBe(true);
  expect(d?.type, 'Must detect HLS type').toBe('hls');

  // ── 6. Wait for socket + extraction ──────────────────────────────────────────
  console.log('\nWaiting 5s for socket connection...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-results/03-after-connect.png' });

  // ── 7. Play video ─────────────────────────────────────────────────────────────
  const videoEl = page.locator('video');
  const videoVisible = await videoEl.isVisible({ timeout: 8000 }).catch(() => false);
  console.log('Video element visible:', videoVisible);

  if (videoVisible) {
    // Try clicking play button or video area
    const playBtn = page.locator('button[aria-label*="play" i], button[aria-label*="воспроизвести" i]').first();
    if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await playBtn.click();
      console.log('Clicked play button');
    } else {
      await videoEl.click({ force: true }).catch(() => {});
      console.log('Clicked video area');
    }

    await page.screenshot({ path: 'test-results/04-playing.png' });
    console.log('Waiting 15s for HLS to buffer and play...');
    await page.waitForTimeout(15_000);
  }

  await page.screenshot({ path: 'test-results/05-final.png' });

  // ── 8. Check video state ───────────────────────────────────────────────────────
  const state = await page.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null;
    if (!v) return { exists: false, paused: null, currentTime: 0, readyState: 0, src: '', error: null };
    return {
      exists: true,
      paused: v.paused,
      currentTime: Math.round(v.currentTime * 100) / 100,
      readyState: v.readyState,
      src: (v.src || v.currentSrc || '').slice(0, 150),
      error: v.error ? `${v.error.code}: ${v.error.message}` : null,
    };
  });

  console.log('\n═══ VIDEO STATE ═══');
  console.log(JSON.stringify(state, null, 2));

  if (errors.length) {
    console.log('\n═══ CONSOLE ERRORS ═══');
    errors.slice(0, 10).forEach(e => console.log(e));
  }
  if (failedReqs.length) {
    console.log('\n═══ FAILED REQUESTS ═══');
    failedReqs.slice(0, 10).forEach(r => console.log(r));
  }

  // ── Assertions ──────────────────────────────────────────────────────────────────
  expect(state.exists, 'Video element must exist').toBe(true);
  expect(state.error, 'Video must not have error').toBeNull();
  expect(state.currentTime, 'Video must advance past 0:00').toBeGreaterThan(0);
});
