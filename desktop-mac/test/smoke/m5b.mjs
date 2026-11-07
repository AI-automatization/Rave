// Smoke test for the native Home (M5.2): real Electron + a fake app-web (API with cookie auth, token refresh, pages).
// Four launches: signed in · access token expired (refresh path) · signed out (web login takes over) · server down (retry).
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
const room = (n, over) => ({ _id: ID(n), name: `Xona ${n}`, videoTitle: null, videoThumbnail: null, videoPlatform: 'youtube', ownerId: 'u', members: [], memberCount: 0, maxMembers: 10, status: 'playing', isPrivate: false, ...over });
const ROOMS = [
  room(1, { name: 'Yulduzlar Jangi', videoTitle: 'Interstellar', memberCount: 9, videoThumbnail: 'https://img.example.com/a.jpg' }),
  room(2, { name: 'Muqaddima', memberCount: 3, videoThumbnail: 'http://insecure.example.com/b.jpg' }),
  room(3, { name: 'Kutish', status: 'waiting', videoPlatform: 'vk' }),
  room(4, { name: 'Pauza', status: 'paused', memberCount: 2 }),
  room(5, { name: 'Tugagan', status: 'ended' }),
  room(6, { name: 'Active (web-only value)', status: 'active' }),
  room(7, { name: '<img src="https://evil.example/pwn.png" onerror="alert(1)">', memberCount: 1 }),
  room(8, { _id: '../admin', name: 'Bad id' }),
];

let calls = [];
let down = 0; // number of /api/rooms requests that still answer 500
const cookieOf = (req, name) => (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const log = `${req.method} ${url.pathname}`;
  calls.push(log);
  if (url.pathname === '/api/rooms') {
    res.setHeader('content-type', 'application/json');
    if (down > 0) { down--; res.statusCode = 500; return res.end('{}'); }
    if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{"message":"Not authenticated"}'); }
    return res.end(JSON.stringify({ success: true, data: ROOMS, message: 'Success', errors: null }));
  }
  if (url.pathname === '/api/auth/refresh' && req.method === 'POST') {
    res.setHeader('content-type', 'application/json');
    if (cookieOf(req, 'refresh_token') !== 'r1') { res.statusCode = 401; return res.end('{}'); }
    res.setHeader('set-cookie', ['access_token=good; Path=/; HttpOnly; Max-Age=900', 'refresh_token=r2; Path=/; HttpOnly; Max-Age=2592000']);
    return res.end('{"success":true}');
  }
  res.setHeader('content-type', 'text/html');
  res.end(`<!doctype html><title>WW ${url.pathname}</title>
<style>:root{--ww-sidebar:248px} body{margin:0;padding-left:var(--ww-sidebar);background:#05050a;color:#fff}
aside{position:fixed;left:0;top:0;bottom:0;width:var(--ww-sidebar);background:#900;display:flex}</style>
<aside class="fixed inset-y-0 left-0 z-40 hidden lg:flex">WEB-SIDEBAR</aside><main>page ${url.pathname}</main>`);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

async function run(name, { cookies = '', action = 'home', startPath = '/home', downFor = 0, ttl = 20, shotDir = '' } = {}) {
  calls = [];
  down = downFor;
  const out = path.join(os.tmpdir(), `ww-m5b-${name}-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m5b-ud-'));
  const env = {
    ...process.env, WW_APP_URL: `http://127.0.0.1:${PORT}${startPath}`, WW_SMOKE_OUT: out, WW_SMOKE_TTL: String(ttl),
    WW_SMOKE_ACTION: action, WW_SMOKE_COOKIES: cookies,
  };
  if (shotDir) env.WW_SMOKE_SHOT = shotDir;
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], { env, stdio: 'ignore' });
  await new Promise((r) => child.on('exit', r));
  const ev = fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ev, calls: [...calls], get: (n) => ev.find((x) => x.event === n)?.inspect };
}

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const pathOf = (u) => { try { return new URL(u).pathname; } catch { return ''; } };
const titles = (home) => (home?.cards ?? []).map((c) => c.title);

// ---------------------------------------------------------------- A: signed in
console.log('--- A: signed in (access token valid)');
{
  const r = await run('signed-in', { cookies: 'access_token=good;refresh_token=r1', shotDir: process.env.WW_SMOKE_SHOT ?? '' });
  const i = r.get('home-initial');
  check(i?.mode === 'home' && i?.homeVisible === true, 'starts on the native Home');
  check(i?.content === null, 'no web page is loaded while Home is shown (nothing else refreshes the tokens)');
  check(!r.calls.some((c) => c.startsWith('POST /api/auth/refresh')), 'no token refresh when the access token is valid');
  check(r.calls.filter((c) => c === 'GET /api/rooms').length >= 1, 'the room list was fetched from /api/rooms');
  check(i?.shell.items.find((x) => x.active)?.id === 'home', 'sidebar highlights Bosh sahifa');
  check(i?.shell.searchHidden === false, 'the search box is visible on Home');
  check(i?.state.canGoBack === false, 'back is disabled on Home');
  const h = i?.home;
  check(h?.bridgeKeys.sort().join(',') === 'onData,open,ready,retry', 'Home bridge exposes exactly ready/open/retry/onData');
  check(h?.webBridge === 'undefined', 'Home has NO web-app bridge');
  check(h?.banner?.title === 'Yulduzlar Jangi' && h?.banner?.sub === 'Interstellar', 'banner = the playing room with the most viewers (title + video title)');
  check(h?.banner?.kicker === 'ASOSIY JONLI XONA' && h?.banner?.join === "Xonaga qo'shilish", 'banner copy from the design');
  check(h?.banner?.viewers === '9 nafar tomoshabin onlayn', 'banner viewer count from memberCount');
  check(h?.section === 'Faol xonalar', 'section title from the design');
  check(JSON.stringify(titles(h)) === JSON.stringify(['Muqaddima', 'Kutish', 'Pauza', '<img src="https://evil.example/pwn.png" onerror="alert(1)">']),
    'grid = the other rooms in server order; "ended", web-only "active" and the bad id are not shown');
  const [c1, c2, c3, c4] = h?.cards ?? [];
  check(c1?.badge === 'JONLI' && c1?.count === '3 kishi' && c1?.button === "Qo'shilish", 'playing room: JONLI, "3 kishi", Qo\'shilish');
  check(c2?.badge === 'BOSHLANMOQDA' && c2?.button === 'Kutish xonasi', 'waiting room: BOSHLANMOQDA + Kutish xonasi');
  check(c3?.badge === 'PAUZADA', 'paused room: PAUZADA');
  check(c4?.title.startsWith('<img') && !(h?.imgs ?? []).some((s) => s?.includes('pwn.png')), 'markup in a room name stays text (no element, no request)');
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
  check(s3?.home.banner?.title === 'Yulduzlar Jangi' && titles(s3?.home).length === 4, 'clearing the search brings everything back');

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
  check(!r.calls.some((c) => c.startsWith('POST /api/auth/refresh')), 'still no token refresh during the whole run');
}

// ---------------------------------------------------------------- B: access token expired -> refresh
console.log('--- B: access token expired, refresh token valid');
{
  const r = await run('refresh', { cookies: 'access_token=old;refresh_token=r1', action: 'home-look' });
  const i = r.get('look-initial');
  const refreshes = r.calls.filter((c) => c === 'POST /api/auth/refresh').length;
  check(refreshes === 1, `exactly one refresh request (got ${refreshes})`);
  check(i?.mode === 'home' && i?.home.banner?.title === 'Yulduzlar Jangi', 'after the refresh the list loads and Home is shown');
  check(i?.content === null, 'the web page was never needed');
}

// ---------------------------------------------------------------- C: signed out
console.log('--- C: signed out');
{
  const r = await run('signed-out', { cookies: '', action: 'home-look', startPath: '/login' });
  const i = r.get('look-initial');
  check(i?.mode === 'web' && i?.homeVisible === false, 'signed out: the web view takes over');
  check(pathOf(i?.content?.url) === '/login', 'the web login page is shown');
  check(i?.shell.items.every((x) => !x.active), 'no sidebar item is highlighted on the login page');
  check(i?.state.canGoBack === false, 'no "back" to a Home that cannot be shown');
  check(r.calls.filter((c) => c === 'POST /api/auth/refresh').length === 1, 'one refresh attempt, which failed (no refresh token)');
  check(r.ev.filter((x) => x.event === 'loaded').length === 1, 'the login page loaded once (no redirect loop)');
}

// ---------------------------------------------------------------- D: server down, then retry
console.log('--- D: server down, then "Qayta urinish"');
{
  const r = await run('retry', { cookies: 'access_token=good;refresh_token=r1', action: 'home-retry', downFor: 1 });
  const a = r.get('retry-initial');
  check(a?.mode === 'home' && a?.home.message === "Xonalarni yuklab bo'lmadi", 'server error: Home shows "Xonalarni yuklab bo\'lmadi" (no crash, no fall-back to login)');
  check(a?.content === null, 'a server error does not load the web page');
  const b = r.get('retry-after');
  check(b?.home.banner?.title === 'Yulduzlar Jangi', 'after "Qayta urinish" the rooms are shown');
}

server.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
