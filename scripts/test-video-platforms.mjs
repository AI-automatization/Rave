/**
 * Playwright test: register (guerrillamail) → verify → login → test 5 video platforms
 */
import { chromium } from 'playwright-chromium';

const BASE = 'https://www.wewatch.uz';
const TS   = Date.now();

// ── Guerrillamail disposable email ─────────────────────────────
const GMAIL_USER = `wewatchtest${TS % 100000}`;
const EMAIL      = `${GMAIL_USER}@guerrillamailblock.com`;
const USERNAME   = `watcher${TS % 100000}`;
const PASS       = 'WatchTest123!';

const VIDEOS = [
  { name: 'Rutube',     url: 'https://rutube.ru/video/659ec6441570f045491218eae29218fd/' },
  { name: 'VK Video',   url: 'https://vk.com/video-76982440_456239101' },
  { name: 'UZmovi',     url: 'https://uzmovi.net/tarjima-kinolarri/8799-och-2-singil-qarindosh-2026-premyera-qirgiz-filmi-ozbek-tilida-uzbek.html' },
  { name: 'AsilMedia',  url: 'https://asilmedia.org/17071-eshref-va-ruya-eshrefning-royosi-esref-ruya-turk-seriali-barcha-qismlar-ozbek-tilida-2025-uzbekcha-tarjima.html' },
  { name: 'AsilMedia2', url: 'https://asilmedia.org/18342-koloniya-zombi-virusi-premyera-2026-uzbek-tilida-ozbekcha-tarjima-kino-full-hd-tas-ix-skachat.html' },
];

function log(msg) { console.log('[TEST]', msg); }

// ── Guerrillamail API ──────────────────────────────────────────
let gmailSid = '';

async function gmailSetAddress() {
  const r = await fetch(
    `https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${GMAIL_USER}&lang=en`,
    { method: 'GET' }
  );
  const d = await r.json();
  gmailSid = d.sid_token;
  log(`Guerrillamail set: ${d.email_addr} (sid: ${gmailSid.slice(0, 8)}...)`);
  return d.email_addr;
}

async function gmailGetCode() {
  log('Polling for verification email (up to 60s)...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const r = await fetch(
        `https://api.guerrillamail.com/ajax.php?f=get_email_list&offset=0&sid_token=${gmailSid}`,
      );
      const d = await r.json();
      const emails = d.list ?? [];
      if (emails.length > 0) {
        const id = emails[0].mail_id;
        const mr = await fetch(
          `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}&sid_token=${gmailSid}`
        );
        const md = await mr.json();
        const body = md.mail_body ?? '';
        // WeWatch sends a 6-digit OTP
        const code = body.replace(/<[^>]+>/g, ' ').match(/\b(\d{6})\b/)?.[1];
        if (code) { log(`Got OTP: ${code}`); return code; }
        log(`  Email found but no 6-digit code yet (attempt ${i+1})`);
      } else {
        log(`  No emails yet (attempt ${i+1})`);
      }
    } catch (e) {
      log(`  API error: ${e.message}`);
    }
  }
  return null;
}

// ── Register ───────────────────────────────────────────────────
async function register(page) {
  const realEmail = await gmailSetAddress();
  log(`Registering: ${realEmail} / username: ${USERNAME}`);

  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle', timeout: 25_000 });
  await page.waitForTimeout(1200);

  // inputs: [0]=username, [1]=email, [2]=password, [3]=confirm
  const inputs = page.locator('input');
  await inputs.nth(0).fill(USERNAME);
  await inputs.nth(1).fill(realEmail);
  await inputs.nth(2).fill(PASS);
  await inputs.nth(3).fill(PASS);
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/ww-register-filled.png' });

  // Submit (button should be enabled now)
  const btn = page.locator('button[type="submit"]').first();
  const enabled = await btn.isEnabled({ timeout: 3000 }).catch(() => false);
  log(`Submit button enabled: ${enabled}`);
  await btn.click({ force: true });

  // Wait for OTP page or success
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/ww-after-submit.png' });
  const url = page.url();
  log(`After submit: ${url}`);

  const bodyText = await page.innerText('body').catch(() => '');
  log(`Page says: ${bodyText.slice(0, 200)}`);

  if (bodyText.match(/код|code|verif|otp/i)) {
    log('OTP step detected');
    const code = await gmailGetCode();
    if (!code) { log('WARN: Could not get OTP — will try login anyway'); return false; }

    // Fill OTP input
    const otpInput = page.locator('input').first();
    await otpInput.fill(code);
    await page.waitForTimeout(300);
    await otpInput.press('Enter');

    const confirmBtn = page.locator('button[type="submit"]').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/ww-after-otp.png' });
    log(`After OTP: ${page.url()}`);
  }

  return !page.url().includes('/register');
}

// ── Login ──────────────────────────────────────────────────────
async function login(page, email) {
  log(`Logging in: ${email}`);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20_000 });
  await page.waitForTimeout(800);

  // Intercept login response for debug
  const loginRespPromise = page.waitForResponse(
    r => r.url().includes('/auth/') && r.url().includes('login'),
    { timeout: 15_000 }
  ).catch(() => null);

  const inputs = page.locator('input');
  const emailIn = page.locator('input[type="email"]').first();
  await emailIn.fill(email);
  const passIn = page.locator('input[type="password"]').first();
  await passIn.fill(PASS);
  await page.waitForTimeout(300);

  const btn = page.locator('button[type="submit"]').first();
  await btn.click({ force: true });

  const resp = await loginRespPromise;
  if (resp) {
    const status = resp.status();
    let body = {};
    try { body = await resp.json(); } catch {}
    log(`Auth API → ${status}: ${JSON.stringify(body).slice(0, 150)}`);
  }

  await page.waitForTimeout(5000);
  const url = page.url();
  const ok = !url.includes('/login');
  log(`Login: ${ok ? '✅ SUCCESS' : '❌ FAILED'} → ${url}`);
  await page.screenshot({ path: '/tmp/ww-after-login.png' });
  return ok;
}

// ── Test one video ─────────────────────────────────────────────
async function testVideo(page, video) {
  const res = { name: video.name, url: video.url, status: '', error: '', platform: '', type: '', method: '', roomOpened: false };
  log(`\n${'─'.repeat(55)}`);
  log(`▶ ${video.name}`);

  try {
    await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(1500);

    // Find Create Room button
    const btn = page.locator('button, a').filter({ hasText: /create|создать|\+/i }).first();
    if (!await btn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await page.screenshot({ path: `/tmp/ww-home-${video.name}.png` });
      res.status = 'ERROR'; res.error = 'No Create Room button'; return res;
    }
    await btn.click();
    await page.waitForTimeout(2000);

    // URL input in modal/dialog
    const urlInput = page.locator('input[placeholder*="https"], input[placeholder*="http"], input[type="url"]').first();
    if (!await urlInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await page.screenshot({ path: `/tmp/ww-dialog-${video.name}.png` });
      res.status = 'ERROR'; res.error = 'No URL input'; return res;
    }
    await urlInput.fill(video.url);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `/tmp/ww-input-${video.name}.png` });

    // The → button: class "h-12 w-12 rounded-xl" — purple gradient button next to URL input
    const arrowBtn = page.locator('button[class*="h-12"][class*="w-12"]').first();
    const arrowVis = await arrowBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const arrowEnabled = await arrowBtn.isEnabled({ timeout: 2000 }).catch(() => false);
    log(`  → button visible=${arrowVis} enabled=${arrowEnabled}`);

    // Intercept extract that fires inside the room (after redirect)
    const extractPromise = page.waitForResponse(
      r => r.url().includes('/extract'),
      { timeout: 50_000 }
    ).catch(() => null);

    // After room created → redirect to /room/{id}
    const roomUrlPromise = page.waitForURL('**/room/**', { timeout: 20_000 }).catch(() => null);

    // Watch for create room API (to detect errors)
    const createRoomRespPromise = page.waitForResponse(
      r => (r.url().includes('/rooms') || r.url().includes('/watch-party')) && r.request().method() === 'POST',
      { timeout: 15_000 }
    ).catch(() => null);

    if (arrowVis && arrowEnabled) {
      await arrowBtn.click();
    } else if (arrowVis) {
      await arrowBtn.click({ force: true });
    } else {
      await urlInput.press('Enter');
    }

    log('  Waiting for room creation...');

    // Check if create room API errored
    const createResp = await createRoomRespPromise;
    if (createResp) {
      const s = createResp.status();
      log(`  Create room API → HTTP ${s}`);
      if (s >= 400) {
        let body = {};
        try { body = await createResp.json(); } catch {}
        res.status = 'CREATE_FAIL';
        res.error  = body?.message ?? `HTTP ${s}`;
        log(`  ❌ Room creation failed: ${res.error}`);
        await page.screenshot({ path: `/tmp/ww-result-${video.name}.png` });
        return res;
      }
    }

    // Wait for redirect to room
    await roomUrlPromise;
    await page.waitForTimeout(2000);

    res.roomOpened = page.url().includes('/room/');
    log(`  Room redirect: ${res.roomOpened ? '✅' : '❌'} → ${page.url()}`);

    if (!res.roomOpened) {
      await page.screenshot({ path: `/tmp/ww-result-${video.name}.png` });
      res.status = 'NO_REDIRECT';
      res.error  = 'No /room/ redirect after clicking →';
      return res;
    }

    // Now wait for extract inside the room
    log('  In room — waiting for video extract...');
    const resp = await extractPromise;

    if (resp) {
      const status = resp.status();
      let body = {};
      try { body = await resp.json(); } catch {}
      log(`  Extract API HTTP ${status}`);

      if (status === 200 && body?.data) {
        const d = body.data;
        res.status   = 'EXTRACT_OK';
        res.platform = d.platform ?? '';
        res.type     = d.type ?? '';
        res.method   = d.extractionMethod ?? '';
        log(`  ✅ platform=${res.platform} type=${res.type} method=${res.method}`);
        log(`  URL: ${String(d.videoUrl ?? '').slice(0, 100)}`);
      } else {
        res.status = 'EXTRACT_FAIL';
        res.error  = body?.message ?? body?.error ?? JSON.stringify(body).slice(0, 120);
        log(`  ❌ ${res.error}`);
      }
    } else {
      res.status = 'TIMEOUT';
      res.error  = 'No /extract response in 45s';
      log('  ⏱ TIMEOUT');
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/ww-result-${video.name}.png` });

  } catch (err) {
    res.status = 'ERROR';
    res.error  = err.message;
    log(`  ❌ EXCEPTION: ${err.message}`);
    await page.screenshot({ path: `/tmp/ww-err-${video.name}.png` }).catch(() => {});
  }

  return res;
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => log(`PAGE ERROR: ${e.message}`));

  const results = [];
  let email = EMAIL;

  try {
    // Try registering
    const registered = await register(page);
    if (!registered) {
      log('Registration may need OTP — will try login');
    }

    // Login with the guerrillamail address we used
    const ok = await login(page, await gmailSetAddress().catch(() => email));
    if (!ok) {
      log('Login failed — aborting tests');
      await browser.close();
      return;
    }

    for (const v of VIDEOS) {
      results.push(await testVideo(page, v));
    }
  } finally {
    await browser.close();
  }

  console.log('\n' + '═'.repeat(60));
  console.log('ИТОГИ');
  console.log('═'.repeat(60));
  for (const r of results) {
    const icon = r.status === 'EXTRACT_OK' ? '✅' : r.status === 'EXTRACT_FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${r.name}`);
    console.log(`   Status  : ${r.status}`);
    if (r.platform) console.log(`   Platform: ${r.platform} | Type: ${r.type} | Method: ${r.method}`);
    if (r.error)    console.log(`   Error   : ${r.error}`);
    console.log(`   Room    : ${r.roomOpened ? '✅ открылась' : '❌ не открылась'}`);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
