// Smoke test for the native Home (M5.2): real Electron + a fake app-web (API with cookie auth, token refresh, pages).
// Launches: signed in · access token expired (refresh path) · signed out (the native sign-in screen) · server down (retry) ·
// language · rails · design · no live room · Sozlamalar · the native sign-in screens end to end (fake BFF auth routes).
// No network, no real login. Run: npm run smoke:m5b   (builds first)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronBin = require('electron');
const root = path.resolve(import.meta.dirname, '..', '..');
const PORT = 8145;

const ID = (n) => `6aec421eb9db0a8762bf6a${String(n).padStart(2, '0')}`;
const room = (n, over) => ({ _id: ID(n), name: `Xona ${n}`, videoTitle: null, videoThumbnail: null, videoPlatform: 'youtube', ownerId: 'owner_u1', members: [], memberCount: 0, maxMembers: 10, status: 'playing', isPrivate: false, ...over });
const ROOMS = [
  room(1, { name: 'Yulduzlar Jangi', videoTitle: 'Interstellar', memberCount: 9, videoThumbnail: 'https://img.example.com/a.jpg' }),
  room(2, { name: 'Muqaddima', ownerId: 'owner_u2', memberCount: 3, videoThumbnail: 'http://insecure.example.com/b.jpg' }),
  room(3, { name: 'Kutish', status: 'waiting', videoPlatform: 'vk' }),
  room(4, { name: 'Pauza', status: 'paused', memberCount: 2 }),
  room(5, { name: 'Tugagan', status: 'ended' }),
  room(6, { name: 'Active (web-only value)', status: 'active' }),
  room(7, { name: '<img src="https://evil.example/pwn.png" onerror="alert(1)">', memberCount: 1 }),
  room(8, { _id: '../admin', name: 'Bad id' }),
];

const TRENDING = [
  { sourceUrl: 'https://youtu.be/top1', title: 'Top film', thumbnail: 'https://img.example.com/t1.jpg', platform: 'youtube', viewers: 42 },
  { sourceUrl: 'https://vk.com/video-busy-1', title: null, thumbnail: null, platform: 'vk', viewers: 7 },
  { sourceUrl: 'javascript:alert(1)', title: 'Evil', thumbnail: null, platform: null, viewers: 1 },
  { sourceUrl: 'file:///etc/passwd', title: 'Evil 2', thumbnail: null, platform: null, viewers: 1 },
];
const HISTORY = [{ sourceUrl: 'https://rutube.ru/video/fail-1', title: 'Watched before', thumbnail: 'http://insecure.example/h.jpg', platform: 'rutube' }];
let posts = []; // bodies of POST /api/rooms ("start watching")
let calls = [];
let down = 0; // number of /api/rooms requests that still answer 500
let bodies = []; // bodies of the settings requests, in order
let noLive = false; // answer /api/rooms with rooms that are all waiting/paused (nothing playing)
let authBodies = []; // bodies of the sign-in requests (BFF routes), in order
let googlePolls = 0;
let googleInits = 0;
const SIGNED_IN = ['access_token=good; Path=/; HttpOnly; SameSite=Lax; Max-Age=900', 'refresh_token=r1; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000'];
const SIGNED_OUT = ['access_token=; Path=/; Max-Age=0', 'refresh_token=; Path=/; Max-Age=0'];
const cookieOf = (req, name) => (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const log = `${req.method} ${url.pathname}`;
  calls.push(log);
  // ---- the web app's BFF sign-in routes (apps/app-web/src/app/api/auth/*) and the auth service's Google poll flow
  if (req.method === 'POST' && ['/api/auth/login', '/api/auth/register', '/api/auth/register/confirm', '/api/auth/forgot-password', '/api/auth/reset-password'].includes(url.pathname)) {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      let json = null;
      try { json = JSON.parse(raw); } catch { /* keep null */ }
      authBodies.push({ route: url.pathname, json, ctype: req.headers['content-type'] ?? '' });
      const send = (status, body, cookies) => { res.statusCode = status; if (cookies) res.setHeader('set-cookie', cookies); res.end(JSON.stringify(body)); };
      if (url.pathname === '/api/auth/login') {
        if (json?.email === 'banned@example.com') return send(403, { success: false, message: 'spam', code: 'ACCOUNT_BLOCKED', reason: 'spam' });
        if (json?.password === 'right-pass') return send(200, { success: true, data: { user: { username: 'azizbek' } } }, SIGNED_IN);
        return send(401, { success: false, message: 'Invalid email or password', errors: null });
      }
      if (url.pathname === '/api/auth/register') {
        if (json?.username === 'taken_name') return send(409, { success: false, message: 'Username already taken', errors: null });
        return send(200, { success: true, data: null, message: 'Verification code sent' });
      }
      if (url.pathname === '/api/auth/register/confirm') {
        if (json?.code === '123456') return send(200, { success: true, data: { user: { username: 'yangi_user' } } }, SIGNED_IN);
        return send(400, { success: false, message: 'Invalid verification code', errors: null });
      }
      if (url.pathname === '/api/auth/forgot-password') return send(200, { success: true, data: null, message: 'If this email exists, a reset link has been sent.' });
      return send(200, { success: true, data: null, message: 'Password reset' });
    });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/auth/google/init') {
    googleInits++;
    googlePolls = 0;
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ data: { state: `state-${googleInits}-abcdefgh` } }));
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/auth/google/poll') {
    googlePolls++;
    res.setHeader('content-type', 'application/json');
    // the first sign-in attempt: the account is blocked; any later one keeps waiting (the user cancels it)
    if (url.searchParams.get('state') === 'state-1-abcdefgh' && googlePolls >= 2) return res.end(JSON.stringify({ data: { error: 'ACCOUNT_BLOCKED', reason: 'spam' } }));
    res.statusCode = 202;
    return res.end(JSON.stringify({ data: null }));
  }
  if ((url.pathname === '/api/rooms/trending' || url.pathname === '/api/rooms/history') && req.method === 'GET') {
    res.setHeader('content-type', 'application/json');
    if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{}'); }
    return res.end(JSON.stringify({ success: true, data: url.pathname.endsWith('trending') ? TRENDING : HISTORY }));
  }
  if (url.pathname === '/api/user/me' || url.pathname === '/api/user/me/avatar' || url.pathname === '/api/auth/change-password' || url.pathname === '/api/auth/logout-all' || url.pathname === '/api/auth/logout') {
    let raw = Buffer.alloc(0);
    req.on('data', (c) => { raw = Buffer.concat([raw, c]); });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{"message":"Not authenticated"}'); }
      const text = raw.toString('latin1');
      let json = null;
      try { json = JSON.parse(raw.toString('utf8')); } catch { /* multipart or empty */ }
      bodies.push({ route: `${req.method} ${url.pathname}`, json, ctype: req.headers['content-type'] ?? '', multipart: text.includes('name="avatar"') ? { filename: /filename="([^"]+)"/.exec(text)?.[1], mime: /Content-Type: (image\/[a-z]+)/.exec(text)?.[1], size: raw.length } : null });
      if (url.pathname === '/api/user/me' && req.method === 'GET') return res.end(JSON.stringify({ success: true, data: { username: 'azizbek', bio: 'Salom', avatar: '/uploads/avatars/a.png' } }));
      if (url.pathname === '/api/user/me' && req.method === 'PUT') {
        if (json?.username === 'taken_name') { res.statusCode = 400; return res.end('{"message":"Username already taken"}'); }
        return res.end(JSON.stringify({ success: true, data: { username: json?.username, bio: json?.bio }, message: 'Profile updated' }));
      }
      if (url.pathname === '/api/auth/change-password') {
        if (json?.oldPassword === 'bad') { res.statusCode = 401; return res.end('{"message":"Current password is incorrect"}'); }
        if (typeof json?.oldPassword !== 'string' || typeof json?.newPassword !== 'string') { res.statusCode = 400; return res.end('{"message":"Validation error"}'); }
      }
      if (url.pathname === '/api/user/me/avatar') return res.end(JSON.stringify({ success: true, data: { avatarUrl: '/uploads/avatars/new.png' } }));
      if (url.pathname === '/api/auth/logout' || url.pathname === '/api/auth/logout-all') res.setHeader('set-cookie', SIGNED_OUT); // like the BFF
      return res.end('{"success":true}');
    });
    return;
  }
  if (url.pathname === '/api/auth/me' || url.pathname === '/api/user/me/friends' || url.pathname.startsWith('/api/user/')) {
    res.setHeader('content-type', 'application/json');
    if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{}'); }
    if (url.pathname === '/api/auth/me') return res.end(JSON.stringify({ success: true, data: { user: { username: 'azizbek' } } }));
    if (url.pathname === '/api/user/me/friends') return res.end(JSON.stringify({ success: true, data: [{ _id: 'f1' }, { _id: 'f2' }, { _id: 'f3' }] }));
    const owner = { owner_u1: 'Sardor', owner_u2: 'Dilnoza' }[url.pathname.slice('/api/user/'.length)];
    if (!owner) { res.statusCode = 404; return res.end('{}'); }
    return res.end(JSON.stringify({ success: true, data: { username: owner } }));
  }
  if (url.pathname === '/api/rooms' && req.method === 'POST') {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{}'); }
      let body = {};
      try { body = JSON.parse(raw); } catch { /* keep {} */ }
      posts.push({ ...body, __contentType: req.headers['content-type'] });
      if (String(body.videoUrl).includes('busy')) { res.statusCode = 409; return res.end(JSON.stringify({ success: false, data: { roomId: ID(21) } })); }
      if (String(body.videoUrl).includes('fail')) { res.statusCode = 500; return res.end('{}'); }
      res.statusCode = 201;
      return res.end(JSON.stringify({ success: true, data: { _id: ID(20) } }));
    });
    return;
  }
  if (url.pathname === '/api/rooms') {
    res.setHeader('content-type', 'application/json');
    if (down > 0) { down--; res.statusCode = 500; return res.end('{}'); }
    if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{"message":"Not authenticated"}'); }
    return res.end(JSON.stringify({ success: true, data: noLive ? ROOMS.filter((r) => r.status !== 'playing') : ROOMS, message: 'Success', errors: null }));
  }
  if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
    res.setHeader('content-type', 'application/json');
    if (cookieOf(req, 'refresh_token') !== 'r1') { res.statusCode = 401; return res.end('{}'); }
    res.setHeader('set-cookie', ['access_token=good; Path=/; HttpOnly; Max-Age=900', 'refresh_token=r2; Path=/; HttpOnly; Max-Age=2592000']);
    return res.end('{"success":true}');
  }
  res.setHeader('content-type', 'text/html');
  const settings = url.pathname === '/settings'
    ? `<section class="ww-panel"><h2>PASSWORD</h2><button>Save</button></section>
<section class="ww-panel"><h2>TARIF</h2><svg class="lucide lucide-crown" width="16" height="16"></svg><button>Pro'ga o'tish — Payme</button></section>
<script>fetch('/api/payment/plan').then(() => { window.__planFetch = 'ok'; }, () => { window.__planFetch = 'blocked'; });</script>`
    : '';
  res.end(`<!doctype html><title>WW ${url.pathname}</title>
<style>:root{--ww-sidebar:248px} body{margin:0;padding-left:var(--ww-sidebar);background:#05050a;color:#fff}
aside{position:fixed;left:0;top:0;bottom:0;width:var(--ww-sidebar);background:#900;display:flex}</style>
<aside class="fixed inset-y-0 left-0 z-40 hidden lg:flex">WEB-SIDEBAR<button class="ww-btn-accent" onclick="document.body.insertAdjacentHTML('beforeend','<div role=dialog>NEW-ROOM-DIALOG</div>')">+</button></aside><main><header><button class="ww-btn-subtle" onclick="document.body.insertAdjacentHTML('beforeend','<div role=dialog>JOIN-DIALOG</div>')">join</button><button class="ww-btn-accent">create</button></header>page ${url.pathname}${settings}</main>`);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

async function run(name, { cookies = '', action = 'home', startPath = '/home', downFor = 0, ttl = 20, shotDir = '', startWeb = false, avatarFile = '', extraEnv = {} } = {}) {
  calls = [];
  posts = [];
  down = downFor;
  bodies = [];
  authBodies = [];
  googleInits = 0;
  googlePolls = 0;
  const out = path.join(os.tmpdir(), `ww-m5b-${name}-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m5b-ud-'));
  const env = {
    ...process.env, WW_APP_URL: `http://127.0.0.1:${PORT}${startPath}`, WW_VB_ALLOW_PRIVATE: '1', WW_SMOKE_OUT: out, WW_SMOKE_TTL: String(ttl),
    WW_SMOKE_ACTION: action, WW_SMOKE_COOKIES: cookies, ...extraEnv,
  };
  if (shotDir) env.WW_SMOKE_SHOT = shotDir;
  if (startWeb) env.WW_START_WEB = '1';
  if (avatarFile) env.WW_SMOKE_AVATAR = avatarFile;
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], { env, stdio: 'ignore' });
  await new Promise((r) => child.on('exit', r));
  const ev = fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ev, calls: [...calls], posts: [...posts], bodies: [...bodies], authBodies: [...authBodies], get: (n) => ev.find((x) => x.event === n)?.inspect };
}

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const canon = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));
const pathOf = (u) => { try { return new URL(u).pathname; } catch { return ''; } };
const titles = (home) => (home?.cards ?? []).map((c) => c.title);

// ---------------------------------------------------------------- A: signed in
console.log('--- A: signed in (access token valid)');
{
  const r = await run('signed-in', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', shotDir: process.env.WW_SMOKE_SHOT ?? '' });
  const i = r.get('home-initial');
  check(i?.mode === 'home' && i?.homeVisible === true, 'starts on the native Home');
  check(i?.content === null, 'no web page is loaded while Home is shown (nothing else refreshes the tokens)');
  check(!r.calls.some((c) => c.startsWith('POST /api/auth/refresh')), 'no token refresh when the access token is valid');
  check(r.calls.filter((c) => c === 'GET /api/rooms').length >= 1, 'the room list was fetched from /api/rooms');
  check(r.get('home-start')?.shell.items.find((x) => x.active)?.id === 'home', 'the app opens on Bosh sahifa (2026-11-13)');
  check(i?.shell.items.find((x) => x.active)?.id === 'rooms', 'sidebar highlights Xonalar on the rooms screen');
  check(i?.shell.searchHidden === false, 'the search box is visible on Home');
  check(i?.state.canGoBack === false, 'back is disabled on Home');
  const h = i?.home;
  check(h?.bridgeKeys.sort().join(',') === 'createRoom,forget,join,joinRoom,newRoom,onData,onOpenDialog,open,openPlatform,readClipboard,ready,retry,searchVideos,settings,sort,videoMeta,watch', 'Home bridge exposes exactly the known calls (incl. the native room dialogs)');
  check(h?.webBridge === 'undefined', 'Home has NO web-app bridge');
  check(h?.banner?.title === 'Yulduzlar Jangi (Interstellar)' && h?.banner?.sub === null, 'banner = the playing room with the most viewers, "name (video title)", no description line (the design has none)');
  check(h?.banner?.kicker === 'ASOSIY JONLI XONA' && h?.banner?.join === "Xonaga qo'shilish", 'banner copy from the design');
  check(h?.banner?.viewers === '9 nafar tomoshabin onlayn', 'banner viewer count from memberCount');
  check(h?.section === 'Faol xonalar', 'section title from the design');
  check(JSON.stringify(titles(h)) === JSON.stringify(['Muqaddima', 'Pauza', '<img src="https://evil.example/pwn.png" onerror="alert(1)">', 'Kutish']),
    'grid = the other rooms, most viewers first (the default sort); "ended", web-only "active" and the bad id are not shown');
  const [c1, c2, c3, c4] = h?.cards ?? [];
  check(c1?.badge === 'JONLI' && c1?.count === '3 kishi' && c1?.button === "Qo'shilish", 'playing room: JONLI, "3 kishi", Qo\'shilish');
  check(c4?.badge === 'BOSHLANMOQDA' && c4?.button === 'Kutish xonasi', 'waiting room: BOSHLANMOQDA + Kutish xonasi');
  check(c2?.badge === 'PAUZADA', 'paused room: PAUZADA');
  check(c3?.title.startsWith('<img') && !(h?.imgs ?? []).some((s) => s?.includes('pwn.png')), 'markup in a room name stays text (no element, no request)');
  check(c1?.tile === 'YOUTUBE' && c4?.tile === 'VK', 'every card has the platform tile with the platform name in capitals');
  check(c1?.subtitle === 'Xona egasi: Dilnoza' && c2?.subtitle === 'Xona egasi: Sardor', 'the owner\'s name is looked up and shown as "Xona egasi: <name>"');
  check(h?.sort?.label === 'Saralash:' && h?.sort?.value === 'viewers' && h?.sort?.options.join('|') === "Ko'ruvchilar soni bo'yicha|Yangi xonalar", 'the sort control, "viewers" by default');
  check(i?.shell.profile?.name === 'azizbek' && i?.shell.profile?.initial === 'A' && i?.shell.profile?.status.startsWith('Onlayn · '), 'profile block: initial, user name and "Onlayn · <this Mac>"');
  const tails = Object.fromEntries((i?.shell.items ?? []).map((x) => [x.id, x.tail]));
  check(tails.rooms === '5' && tails.friends === '3', 'sidebar counters: 5 rooms, 3 friends');
  check((h?.imgs ?? []).every((s) => typeof s === 'string' && s.startsWith('https://')), 'only https posters are ever put into the page (the http one was dropped)');
  check(h?.scripts === 0, 'no script elements in the page');
  const hb = i?.homeBounds, sb = i?.shellBounds;
  check(hb?.x === 240 && hb?.y === 52 && hb?.width === sb?.width - 240 && hb?.height === sb?.height - 52, 'Home fills the area right of the sidebar, below the toolbar');

    const s1 = r.get('home-search');
  check(s1?.home.banner?.title === 'Muqaddima' && titles(s1?.home).length === 0, 'search "muq": only Muqaddima is left, and it becomes the banner (picked after filtering)');
  check(s1?.shell.searchValue === 'muq', 'the search box shows what was typed');
  const s2 = r.get('home-search-none');
  check(s2?.home.message === 'Hech narsa topilmadi' && s2?.home.banner === null, 'a search with no match shows "Hech narsa topilmadi"');
  const s3 = r.get('home-search-cleared');
  check(s3?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)' && titles(s3?.home).length === 4, 'clearing the search brings everything back');

  const hs = r.ev.find((x) => x.event === 'home-hostile-ids')?.replies ?? [];
  check(hs.length === 6 && hs.every((x) => x && x.ok === false), 'hostile / invalid room ids are all refused (6 of 6)');
  check(r.get('home-after-hostile')?.mode === 'home', 'hostile ids did not leave Home');

  const rm = r.get('home-room');
  check(rm?.mode === 'web' && rm?.homeVisible === false, 'joining a room switches to the web view and hides Home');
  check(pathOf(rm?.content?.url) === `/room/${ID(2)}`, 'the first card opens its own room page, on the app origin');
  check(rm?.content?.homeBridge === 'undefined' && rm?.content?.shellBridge === 'undefined' && rm?.content?.desktopBridge === 'object',
    'the room page has the web bridge only (no shell/Home bridge)');
  check(rm?.content?.asideDisplay === 'none', "the web app's own sidebar is hidden inside the room page");
  check(rm?.state.canGoBack === true && rm?.shell.searchHidden === true, 'back is enabled and the search box is hidden in a room');

  const bk = r.get('home-back');
  check(bk?.mode === 'home' && bk?.homeVisible === true && bk?.content === null, 'back from the room returns to Home and unloads the web page');
  check(r.get('home-friends')?.mode === 'web' && pathOf(r.get('home-friends')?.content?.url) === '/friends', "sidebar Do'stlar opens the web page");
  const vs = r.get('home-via-sidebar');
  check(vs?.mode === 'home' && vs?.content === null && vs?.shell.items.find((x) => x.active)?.id === 'home', 'sidebar Bosh sahifa returns to the native Home');
  check(vs?.home.banner !== null && vs?.home.cards.length === 0 && vs?.home.rails.length === 2, 'Bosh sahifa = banner + the two rails (no room grid)');
  check(!r.calls.some((c) => c.startsWith('POST /api/auth/refresh')), 'still no token refresh during the whole run');
}

// ---------------------------------------------------------------- B: access token expired -> refresh
console.log('--- B: access token expired, refresh token valid');
{
  const r = await run('refresh', { cookies: 'wewatch-locale=uz;access_token=old;refresh_token=r1', action: 'home-look' });
  const i = r.get('look-initial');
  const refreshes = r.calls.filter((c) => c === 'POST /api/auth/refresh').length;
  check(refreshes === 1, `exactly one refresh request (got ${refreshes})`);
  check(i?.mode === 'home' && i?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)', 'after the refresh the list loads and Home is shown');
  check(i?.content === null, 'the web page was never needed');
}

// ---------------------------------------------------------------- C: signed out (first run: no cookies at all)
console.log('--- C: signed out');
{
  const r = await run('signed-out', { cookies: '', action: 'home-look', startPath: '/home' });
  const i = r.get('look-initial');
  check(i?.mode === 'auth' && i?.homeVisible === false && i?.authVisible === true, 'signed out: the native sign-in screen takes over');
  check(i?.content === null && !r.ev.some((x) => x.event === 'loaded'), 'no web page is loaded at all (the web /login is never shown)');
  check(!r.calls.some((c) => c === 'GET /login' || c === 'GET /register' || c === 'GET /'), 'the web sign-in page was never even requested');
  check(i?.auth?.screen === 'login' && i?.auth?.title === 'Xush kelibsiz' && i?.auth?.lang === 'uz', 'first run: the login screen, in Uzbek (no language cookie yet)');
  check(i?.shell.langHidden === false && JSON.stringify(i?.shell.langActive) === '["uz"]', 'the UZ/RU switch is in the toolbar, Uzbek selected');
  check(i?.shell.collapsed === true && i?.shell.newRoomHidden === true, 'no sidebar, no "Yangi xona"');
  check(i?.authBounds?.x === 0 && i?.authBounds?.y === 52 && i?.authBounds?.width === i?.shellBounds?.width, 'the sign-in screen fills the window below the toolbar');
  check(i?.shell.items.every((x) => !x.active), 'no sidebar item is highlighted');
  check(i?.state.canGoBack === false && i?.state.signedIn === false, 'no "back", not signed in');
  check(r.calls.filter((c) => c === 'POST /api/auth/refresh').length === 1, 'one refresh attempt, which failed (no refresh token)');
}

// ---------------------------------------------------------------- D: server down, then retry
console.log('--- D: server down, then "Qayta urinish"');
{
  const r = await run('retry', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'home-retry', downFor: 1 });
  const a = r.get('retry-initial');
  check(a?.mode === 'home' && a?.home.message === "Xonalarni yuklab bo'lmadi", 'server error: Home shows "Xonalarni yuklab bo\'lmadi" (no crash, no fall-back to login)');
  check(a?.content === null, 'a server error does not load the web page');
  const b = r.get('retry-after');
  check(b?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)', 'after "Qayta urinish" the rooms are shown');
}

// ---------------------------------------------------------------- E: language + subscription
console.log('--- E: language follows the web app; subscription (obuna) is reachable');
{
  const r = await run('lang', { cookies: 'wewatch-locale=ru;access_token=good;refresh_token=r1', action: 'lang', startPath: '/settings', startWeb: true, ttl: 25 });
  const labels = (x) => (x?.shell.items ?? []).map((i) => i.label).join('|');
  const ru = r.get('lang-ru');
  check(labels(ru) === 'Главная|Комнаты|Друзья|История|Настройки', 'Russian language cookie -> Russian sidebar items');
  check(ru?.shell.titles.join('|') === 'ОСНОВНОЕ|ДРУЗЬЯ И СООБЩЕСТВО|БИБЛИОТЕКА', 'Russian section titles');
  check(ru?.shell.backLabel === 'Назад' && ru?.shell.htmlLang === 'ru', 'Russian button label and page language');
  check(ru?.content?.planSection !== 'none' && ru?.content?.planSection !== null, 'the subscription panel (TARIF / Pro) is visible on Settings');
  check(ru?.content?.planFetch === 'ok', "the page's request to the payment API goes through");
  check(r.calls.some((c) => c.includes('/api/payment')), 'the payment API reached the server');
  const uz = r.get('lang-uz');
  check(labels(uz) === "Bosh sahifa|Xonalar|Do'stlar|Tarix|Sozlamalar", 'switching the web language to Uzbek changes the sidebar at once');
  check(uz?.shell.titles.join('|') === "ASOSIY|DO'STLAR & HAMJAMIYAT|KUTUBXONA" && uz?.shell.htmlLang === 'uz', 'Uzbek section titles (the approved design)');
  const en = r.get('lang-en');
  check(labels(en) === 'Home|Rooms|Friends|History|Settings', 'switching to English changes the sidebar at once');
  check(en?.shell.titles.join('|') === 'MAIN|FRIENDS & COMMUNITY|LIBRARY', 'English section titles');
  const he = r.get('lang-home-en');
  check(he?.mode === 'home', 'the sidebar Xonalar opens the native room list');
  check(he?.home.banner?.kicker === 'LIVE RIGHT NOW' && he?.home.banner?.join === 'Join' && he?.home.banner?.viewers === '9 watching', 'Home banner in English');
  check(he?.home.section === 'Active rooms' && he?.home.cards[0]?.button === 'Join' && he?.home.cards[3]?.button === 'Waiting room', 'Home section and buttons in English');
  check(he?.home.cards.map((c) => c.badge).join('|').startsWith('LIVE|PAUSED') && he?.home.cards[3]?.badge === 'STARTING' && he?.home.cards[0]?.count === '3', 'Home badges and counters in English');
  check(he?.shell.searchPlaceholder === 'Search', 'search box in English');
  const hr = r.get('lang-home-ru');
  check(hr?.home.banner?.kicker === 'СЕЙЧАС В ЭФИРЕ' && hr?.home.banner?.viewers === '9 смотрят' && hr?.home.cards[0]?.count === '3 чел.', 'a language change while Home is shown redraws Home and the sidebar at once (Russian)');
  check(labels(hr) === 'Главная|Комнаты|Друзья|История|Настройки', 'the sidebar followed too');
}

// ---------------------------------------------------------------- F: rails (weekly top, history) + start watching
console.log('--- F: rails and "start watching"');
{
  const r = await run('rails', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'rails', ttl: 30, shotDir: process.env.WW_SMOKE_SHOT_RAILS ?? '' });
  const i = r.get('rails-initial');
  const [top, hist] = i?.home.rails ?? [];
  check(top?.title === 'Haftaning top kinolari' && hist?.title === 'Ko‘rganlarim', 'both rails are shown under the rooms, with the web app\'s own titles');
  check(JSON.stringify(top?.cards.map((c) => c.title)) === JSON.stringify(['Top film', 'https://vk.com/video-busy-1']), 'weekly top: the two valid videos (javascript: and file: links were dropped); no title -> the link, like the web app');
  check(top?.cards.map((c) => c.rank).join('|') === '#1|#2' && top?.cards.map((c) => c.views).join('|') === '42 kishi ko‘rdi|7 kishi ko‘rdi', 'weekly top: rank badges and viewer counts');
  check(hist?.cards.length === 1 && hist?.cards[0].title === 'Watched before' && hist?.cards[0].rank === null && hist?.cards[0].views === null, 'history: one card, no rank and no viewer count');
  check((i?.home.imgs ?? []).every((x) => typeof x === 'string' && x.startsWith('https://')) && !(i?.home.imgs ?? []).some((x) => x.includes('insecure')), 'only https posters (the http one was dropped)');
  check(i?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)' && i?.home.cards.length === 0, 'Bosh sahifa: the banner above the rails, no room grid');

  const hs = r.ev.find((x) => x.event === 'rails-hostile')?.replies ?? [];
  check(hs.length === 8 && hs.every((x) => x && x.ok === false), 'hostile calls (unknown rail, index out of range / negative / string / fractional, null, __proto__) are all refused (8 of 8)');
  check(r.get('rails-after-hostile')?.mode === 'home', 'hostile calls did not leave Home');

  const rm = r.get('rails-room');
  check(rm?.mode === 'web' && pathOf(rm?.content?.url) === `/room/${ID(20)}`, 'a click on the 1st weekly-top video opens the room the server created');
  check(canon(r.posts[0]) === canon({ name: 'Top film', videoUrl: 'https://youtu.be/top1', videoTitle: 'Top film', videoThumbnail: 'https://img.example.com/t1.jpg', isPrivate: true, __contentType: 'application/json' }),
    'the room request is exactly the web app\'s: private, named after the video, JSON');
  check(r.get('rails-back')?.mode === 'home' && r.get('rails-back')?.home.rails.length === 2, 'back returns to Home with the rails still there');

  const cf = r.get('rails-conflict');
  const u = new URL(cf?.content?.url ?? 'http://x/');
  check(u.pathname === `/room/${ID(21)}` && u.searchParams.get('play') === 'https://vk.com/video-busy-1', '409: the open room is entered with ?play=<the video>, like the web app');
  check(canon(r.posts[1]) === canon({ videoUrl: 'https://vk.com/video-busy-1', isPrivate: true, __contentType: 'application/json' }), 'a video without a title is sent without name/videoTitle');

  const fl = r.get('rails-fail');
  check(fl?.mode === 'home' && fl?.content === null, 'a server failure keeps the user on Home (no half-open room)');
  check(fl?.home.toast === 'Xona ochilmadi, qayta urinib ko‘ring', 'and tells them, in their language');
  check(r.posts.length === 3, 'three requests in all: hostile calls and invalid items made none');
  check(r.get('rails-search')?.home.rails.length === 0, 'a room search hides the rails');
}

// ---------------------------------------------------------------- G: the design (toolbar, sort, collapse, other screens, new room)
console.log('--- G: Stitch design details');
{
  const r = await run('design', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'design', ttl: 40, shotDir: process.env.WW_SMOKE_SHOT_DESIGN ?? '' });
  const a = r.get('design-initial');
  check(r.get('design-start')?.shell.items.find((x) => x.active)?.id === 'home', 'the app opens on Bosh sahifa (2026-11-13)');
  check(a?.home.section === 'Faol xonalar', 'Xonalar shows the design section');
  const n = r.get('design-newest');
  check(n?.home.sort.value === 'newest', 'the sort control follows the choice');
  const bad = r.ev.find((x) => x.event === 'design-sort-hostile')?.replies ?? [];
  check(bad.length === 6 && bad.every((x) => x && x.ok === false), 'an unknown sort key is refused (6 of 6)');
  const e = r.get('design-expanded');
  check(e?.shell.collapsed === false && e?.homeBounds?.x === 240, 'the sidebar is always open when signed in (240 px), there is no collapse button');
  check(!(r.get('design-initial')?.shell.items ?? []).some((x) => x.id === 'live'), 'there is no Jonli efirlar item (removed 2026-11-13)');
  const h = r.get('design-history');
  check(h?.shell.items.find((x) => x.active)?.id === 'history' && JSON.stringify(h?.home.gridWatch) === JSON.stringify(['Watched before']), 'Tarix: a grid with the watched videos, no segments/search');
  const hm = r.get('design-home');
  check(hm?.shell.items.find((x) => x.active)?.id === 'home' && hm?.home.rails.length === 2, 'Bosh sahifa = banner + rails');
  const nr = r.get('design-new-room');
  check(nr?.mode === 'home' && nr?.content === null && typeof nr?.home.roomDialog === 'string' && nr.home.roomDialog.length > 0, '"+ Yangi xona" opens the NATIVE create-room dialog (no web page loaded)');
}

// ---------------------------------------------------------------- H: rooms exist but none is playing
console.log('--- H: rooms exist, none playing');
{
  noLive = true;
  const r = await run('nolive', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'home-nolive', ttl: 30 });
  noLive = false;
  const n = r.get('nolive-home');
  check(n?.shell.items.find((x) => x.active)?.id === 'home' && n?.home.banner === null, 'Bosh sahifa without a playing room has no banner');
  check(n?.home.rails.length === 2 && n?.home.message !== 'Hech narsa topilmadi', 'but the weekly top and history rails are still shown (no "Hech narsa topilmadi")');
  check(n?.home.head?.title === 'Salom, azizbek' || n?.home.head?.title === 'Xayrli tong, azizbek' || n?.home.head?.title === 'Xayrli kech, azizbek', 'the header greets the user by name (web wording)');
  check(n?.home.head?.sub === 'Hozir hech kim onlayn emas' && JSON.stringify(n?.home.head?.buttons) === JSON.stringify(["Qo'shilish", 'Xona yaratish']), 'header: nobody online, and the two actions Qo\'shilish / Xona yaratish');
  check(n?.home.hero?.title === 'Xona oching va birga tomosha qiling' && n?.home.hero?.steps.length === 3 && n?.home.hero?.chips.join('|') === 'YouTube|VK Video|Rutube|To‘g‘ridan havola', 'the start block: title, 3 steps, supported sources (as on the web)');
  check(JSON.stringify(n?.home.hero?.buttons) === JSON.stringify(['Xona yaratish', 'Kod bilan kirish']), 'start block buttons: Xona yaratish / Kod bilan kirish');
  const nc = r.get('nolive-create'), nj = r.get('nolive-join');
  check(nc?.mode === 'home' && nc?.content === null && !!nc?.home.roomDialog, '"Xona yaratish" in the start block opens the native create dialog');
  check(nj?.mode === 'home' && nj?.content === null && !!nj?.home.roomDialog && nj.home.roomDialog !== nc?.home.roomDialog, '"Kod bilan kirish" opens the native join dialog'); 
}

// ---------------------------------------------------------------- I: Sozlamalar (the app's own settings screen)
console.log('--- I: Sozlamalar');
{
  const cookies = 'wewatch-locale=uz;access_token=good;refresh_token=r1';
  const r = await run('settings', { cookies, action: 'settings', ttl: 40, shotDir: process.env.WW_SMOKE_SHOT_SETTINGS ?? '' });
  const a = r.get('settings-initial');
  check(a?.shell.items.find((x) => x.active)?.id === 'settings' && a?.mode === 'home' && a?.content === null, 'Sozlamalar is a native screen (no web page loaded)');
  check(a?.home.settings?.title === 'Sozlamalar' && a?.home.settings?.panels.length === 5, 'five sections: profile, language, password, sessions, danger zone');
  check(a?.home.settings?.username === 'azizbek' && a?.home.settings?.bio === 'Salom' && a?.home.settings?.initial === 'A', 'the profile is loaded from the server (name, bio, initial)');
  check(a?.shell.searchHidden === true, 'no search box on Sozlamalar');
  check(a?.home.settings?.avatarImg === null && a?.home.settings?.initial === 'A', 'a picture that cannot load (here: plain http is blocked by the page policy) falls back to the initial');
  const s = r.get('settings-saved');
  const put = r.bodies.find((b) => b.route === 'PUT /api/user/me');
  check(JSON.stringify(put?.json) === JSON.stringify({ username: 'yangi_ism', bio: 'Yangi bio' }), 'Saqlash sends { username, bio } to PUT /api/user/me');
  check(s?.shell.profile?.name === 'yangi_ism', 'the sidebar profile block follows the new name');
  const bad = r.ev.find((x) => x.event === 'settings-bad-profile')?.replies ?? [];
  check(JSON.stringify(bad.map((x) => x.kind)) === JSON.stringify(['username', 'username', 'taken', 'bio', 'invalid', 'invalid']), 'bad profiles: wrong names / bio / non-strings refused, a taken name reported');
  check(r.bodies.filter((b) => b.route === 'PUT /api/user/me').length === 2, 'only the valid save and the "taken" one reached the server (the 4 invalid ones were stopped locally)');
  const ru = r.get('settings-ru');
  check(ru?.home.settings?.title === 'Настройки' && ru?.home.settings?.langs.find((x) => x.active)?.t === 'Русский' && ru?.shell.items.find((x) => x.id === 'settings')?.label === 'Настройки', 'the language buttons switch the whole app (cookie wewatch-locale)');
  const pw = r.ev.find((x) => x.event === 'settings-bad-password')?.replies ?? [];
  check(JSON.stringify(pw.map((x) => x.kind)) === JSON.stringify(['wrongPassword', 'mismatch', 'min', 'required']), 'bad password changes: wrong current (server), mismatch / too short / empty (stopped locally)');
  check(r.ev.find((x) => x.event === 'settings-bad-language')?.reply?.ok === false, 'an unknown language is refused');
  const ok = r.bodies.filter((b) => b.route === 'POST /api/auth/change-password');
  check(ok.length === 2 && JSON.stringify(ok[1].json) === JSON.stringify({ oldPassword: 'old', newPassword: 'newpass1' }), 'the password goes out as { oldPassword, newPassword } (what the server expects)');
  const after = r.get('settings-after-password');
  check(after?.mode === 'auth' && after?.auth?.screen === 'login' && after?.content === null && r.calls.includes('POST /api/auth/logout'), 'after a password change the app signs out and shows the native sign-in screen');
}
{
  const png = path.join(os.tmpdir(), `ww-avatar-${Date.now()}.png`);
  fs.writeFileSync(png, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300, 7)]));
  const r = await run('settings-b', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'settings-b', ttl: 30, avatarFile: png });
  const up = r.bodies.find((b) => b.route === 'PATCH /api/user/me/avatar');
  check(r.ev.find((x) => x.event === 'settings-avatar')?.reply?.ok === true && up?.ctype.startsWith('multipart/form-data') && up?.multipart?.mime === 'image/png' && up?.multipart?.filename === 'avatar.png', 'avatar: sent as multipart field "avatar" with its real type');
  check(r.ev.find((x) => x.event === 'settings-signout-all')?.reply?.ok === true && r.calls.includes('POST /api/auth/logout-all'), 'sign out of all devices calls /api/auth/logout-all');
  check(r.get('settings-after-signout')?.mode === 'auth' && r.get('settings-after-signout')?.auth?.screen === 'login', 'and the native sign-in screen is shown');
  const txt = path.join(os.tmpdir(), `ww-avatar-${Date.now()}.txt`);
  fs.writeFileSync(txt, 'not a picture');
  const r2 = await run('settings-b2', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'settings-b', ttl: 30, avatarFile: txt });
  check(r2.ev.find((x) => x.event === 'settings-avatar')?.reply?.kind === 'type' && !r2.bodies.some((b) => b.route.startsWith('PATCH')), 'a file that is not JPEG/PNG/WebP is refused before anything is sent');
}
{
  const r = await run('settings-c', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'settings-c', ttl: 30 });
  check(r.ev.find((x) => x.event === 'settings-delete-empty')?.reply?.kind === 'required', 'delete account: an empty password is refused locally');
  const del = r.bodies.find((b) => b.route === 'DELETE /api/user/me');
  check(r.ev.find((x) => x.event === 'settings-delete')?.reply?.ok === true && JSON.stringify(del?.json) === JSON.stringify({ password: 'secret1' }), 'delete account: DELETE /api/user/me with the password');
  check(r.calls.includes('POST /api/auth/logout') && r.get('settings-after-delete')?.mode === 'auth', 'afterwards the app signs out and shows the native sign-in screen');
}

// ---------------------------------------------------------------- J: the native sign-in screens, end to end
console.log('--- J: native sign-in screens');
{
  const r = await run('auth', {
    cookies: 'wewatch-locale=uz', action: 'auth', ttl: 70, shotDir: process.env.WW_SMOKE_SHOT_AUTH ?? '',
    extraEnv: { WW_AUTH_URL: `http://127.0.0.1:${PORT}/api/v1/auth`, WW_AUTH_NO_BROWSER: '1', WW_AUTH_POLL_MS: '300' },
  });
  const ev = (n) => r.ev.find((x) => x.event === n);
  const a = r.get('auth-initial');
  check(a?.mode === 'auth' && a?.auth?.screen === 'login', 'starts on the native login screen');
  check(a?.auth?.bridgeKeys.sort().join(',') === 'about,cancelGoogle,confirm,forgot,google,help,login,onData,ready,register,reset', 'the sign-in bridge exposes exactly its own actions');
  check(a?.auth?.webBridge === 'undefined' && a?.home.bridgeKeys.length > 0 && !a?.home.bridgeKeys.includes('login'), 'no web-app bridge in the sign-in view; Home has no sign-in calls');
  check(a?.auth?.sub === 'Do’stlaringiz sizni kutmoqda — hisobingizga kiring.' && a?.auth?.google === 'Google' && a?.auth?.divider === 'yoki', 'the web texts: heading, Google button, "yoki" divider');
  check(JSON.stringify(a?.auth?.inputs) === JSON.stringify([{ name: 'email', type: 'email', placeholder: 'siz@example.com' }, { name: 'password', type: 'password', placeholder: 'Parolingiz' }]), 'email + password fields with the web placeholders');
  check(JSON.stringify(a?.auth?.labels) === JSON.stringify(['Email', 'Parol']) && a?.auth?.primary === 'Kirish' && a?.auth?.primaryDisabled === true, 'labels; "Kirish" stays disabled until both fields are filled');
  check(JSON.stringify(a?.auth?.links) === JSON.stringify(['Unutdingizmi?', "Ro'yxatdan o'ting"]), '"Unutdingizmi?" and "Ro\'yxatdan o\'ting" links');
  check(JSON.stringify(a?.auth?.footer) === JSON.stringify(['Yordam', 'WeWatch haqida']), 'footer: Yordam · WeWatch haqida');
  check(a?.auth?.telegram === false, 'no Telegram anywhere on the screen');
  check(a?.auth?.scripts === 0, 'no script elements in the page');

  const hs = ev('auth-hostile')?.replies ?? [];
  check(hs.length === 9 && hs.every((x) => x && x.ok === false && x.kind === 'invalid'), 'hostile / invalid calls are refused locally (9 of 9)');
  const ru = r.get('auth-ru');
  check(ru?.auth?.title === 'С возвращением' && ru?.auth?.primary === 'Войти' && ru?.auth?.divider === 'или' && JSON.stringify(ru?.auth?.footer) === JSON.stringify(['Помощь', 'О WeWatch']), 'the toolbar switch redraws the screen in Russian');
  check(JSON.stringify(ru?.shell.langActive) === '["ru"]' && ru?.shell.htmlLang === 'ru', 'and the switch shows Русский as chosen');

  const w = r.get('auth-wrong');
  check(w?.auth?.notice === 'Invalid email or password', 'a wrong password shows the server\'s own message (as the web does)');
  const lb = r.authBodies.find((b) => b.route === '/api/auth/login');
  check(JSON.stringify(lb?.json) === JSON.stringify({ email: 'm7@example.com', password: 'wrong-pass' }) && lb?.ctype === 'application/json', 'login request = { email, password } as JSON to the BFF, exactly like LoginForm');
  check(r.get('auth-banned')?.auth?.notice === 'Akkaunt bloklanganSabab: spamAgar bu xato deb hisoblasangiz — qo\'llab-quvvatlash xizmatiga murojaat qiling.', 'a blocked account shows the ban notice with the reason');

  check(r.get('auth-google-wait')?.auth?.title === 'Kirish...', 'Google: "Kirish..." while the system browser is used');
  check(r.get('auth-google-blocked')?.auth?.notice?.startsWith('Akkaunt bloklangan'), 'Google: a blocked account is shown on the screen (no dialog)');
  const gc = r.get('auth-google-cancelled');
  check(gc?.auth?.screen === 'login' && gc?.auth?.notice === null, 'Google: "Kirish sahifasiga qaytish" stops waiting');
  check(ev('login-browser')?.opened === false, 'Google: the system browser was not opened in the smoke run');

  const ri = r.get('auth-register-invalid');
  check(JSON.stringify(ri?.auth?.fieldErrors) === JSON.stringify(["3–20 belgi: faqat lotin harflari, raqamlar va _ (bo'sh joysiz)", 'Kamida 6 ta belgi']) && ri?.auth?.primaryDisabled === true, 'register: the web rules (user name pattern, 6+ password) block the button');
  check(r.get('auth-register-taken')?.auth?.notice === 'Username already taken', 'register: a taken name shows the server message');
  const rb = r.authBodies.filter((b) => b.route === '/api/auth/register');
  check(JSON.stringify(rb[1]?.json) === JSON.stringify({ username: 'yangi_user', email: 'new@example.com', password: 'secret12' }), 'register request = { username, email, password }; the user name is trimmed like the web input');
  check(JSON.stringify(rb[0]?.json?.username) === '"taken_name"', 'spaces typed around the name are removed before sending');
  const v = r.get('auth-verify');
  check(v?.auth?.screen === 'verify' && v?.auth?.title === 'Emailni tasdiqlang' && v?.auth?.inputs.length === 6, 'the e-mail step: 6 code boxes');
  check(v?.auth?.links.some((t) => t.startsWith('Qayta yuborish (') && t.endsWith('s)')), 'resend is on a 60 s cooldown right after the code was sent');
  const cw = r.get('auth-code-wrong');
  check(cw?.auth?.notice === 'Invalid verification code', 'a wrong code shows the server message');
  const cb = r.authBodies.filter((b) => b.route === '/api/auth/register/confirm');
  check(JSON.stringify(cb[0]?.json) === JSON.stringify({ email: 'new@example.com', code: '000000' }), 'confirm request = { email, code } (a pasted code is spread over the boxes and sent)');

  const fs2 = r.get('auth-forgot-sent');
  check(fs2?.auth?.title === 'Havola yuborildi' && fs2?.auth?.sub?.includes('m7@example.com'), 'forgot password: the web\'s "Havola yuborildi" with the address');
  check(JSON.stringify(r.authBodies.find((b) => b.route === '/api/auth/forgot-password')?.json) === JSON.stringify({ email: 'm7@example.com' }), 'forgot request = { email }');
  const hp = r.get('auth-help');
  check(hp?.help?.open === true && hp?.help?.visible === true && hp?.state.canGoBack === true, '"Yordam" opens the native Help screen above the sign-in screen');
  check(r.get('auth-help-closed')?.help?.open === false && r.get('auth-help-closed')?.auth?.screen === 'login', 'its back button returns to the sign-in screen');
  check(ev('external-suppressed')?.url === 'https://wewatch.uz', '"WeWatch haqida" opens the fixed site https://wewatch.uz (suppressed in the smoke run)');

  const rg = r.get('auth-registered');
  check(rg?.mode === 'home' && rg?.state.signedIn === true && rg?.shell.collapsed === false && rg?.shell.langHidden === true, 'the right code signs in: native Home with the sidebar, no language switch');
  const ck = ev('auth-cookies')?.cookies ?? [];
  check(ck.some((c) => c.name === 'access_token' && c.httpOnly) && ck.some((c) => c.name === 'refresh_token' && c.httpOnly), 'the BFF\'s httpOnly access_token / refresh_token cookies are in the app session');
  const lo = r.get('auth-after-logout');
  check(ev('auth-logout')?.reply?.ok === true && lo?.mode === 'auth' && lo?.auth?.screen === 'login' && lo?.auth?.inputs.every(() => true), 'sign out returns to the native sign-in screen');
  check(lo?.shell.collapsed === true && lo?.shell.profile === null, 'the sidebar and the user\'s name are gone');
  const si = r.get('auth-signed-in');
  check(si?.mode === 'home' && si?.shell.items.find((x) => x.active)?.id === 'home' && si?.shell.profile?.name === 'azizbek', 'the right password signs in: native Bosh sahifa and the user\'s name');
  const ic = r.get('auth-intercepted');
  check(ic?.mode === 'auth' && ic?.content === null && !r.calls.includes('GET /login'), 'a web page going to /login is stopped: the native screen shows instead (the web page never loads)');
  const rd = r.get('auth-redirected');
  check(rd?.mode === 'web' && pathOf(rd?.content?.url) === `/room/${ID(3)}` && rd?.state.signedIn === true, 'after signing in the user lands on the page that asked for it (?redirect=)');
  check(!JSON.stringify(r.ev).includes('right-pass') && !JSON.stringify(r.ev).includes('secret12'), 'no password ever reaches the log');
}

server.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
