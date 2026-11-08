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
let noLive = false; // answer /api/rooms with rooms that are all waiting/paused (nothing playing)
const cookieOf = (req, name) => (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const log = `${req.method} ${url.pathname}`;
  calls.push(log);
  if ((url.pathname === '/api/rooms/trending' || url.pathname === '/api/rooms/history') && req.method === 'GET') {
    res.setHeader('content-type', 'application/json');
    if (cookieOf(req, 'access_token') !== 'good') { res.statusCode = 401; return res.end('{}'); }
    return res.end(JSON.stringify({ success: true, data: url.pathname.endsWith('trending') ? TRENDING : HISTORY }));
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

async function run(name, { cookies = '', action = 'home', startPath = '/home', downFor = 0, ttl = 20, shotDir = '', startWeb = false } = {}) {
  calls = [];
  posts = [];
  down = downFor;
  const out = path.join(os.tmpdir(), `ww-m5b-${name}-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m5b-ud-'));
  const env = {
    ...process.env, WW_APP_URL: `http://127.0.0.1:${PORT}${startPath}`, WW_SMOKE_OUT: out, WW_SMOKE_TTL: String(ttl),
    WW_SMOKE_ACTION: action, WW_SMOKE_COOKIES: cookies,
  };
  if (shotDir) env.WW_SMOKE_SHOT = shotDir;
  if (startWeb) env.WW_START_WEB = '1';
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], { env, stdio: 'ignore' });
  await new Promise((r) => child.on('exit', r));
  const ev = fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ev, calls: [...calls], posts: [...posts], get: (n) => ev.find((x) => x.event === n)?.inspect };
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
  check(i?.shell.items.find((x) => x.active)?.id === 'rooms', 'sidebar highlights Xonalar (the app\'s main window)');
  check(i?.shell.searchHidden === false, 'the search box is visible on Home');
  check(i?.state.canGoBack === false, 'back is disabled on Home');
  const h = i?.home;
  check(h?.bridgeKeys.sort().join(',') === 'join,newRoom,onData,open,ready,retry,sort,watch', 'Home bridge exposes exactly ready/open/retry/watch/sort/newRoom/join/onData');
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
  check(tails.rooms === '5' && tails.friends === '3' && tails.live === '', 'sidebar counters: 5 rooms, 3 friends, and the live dot (no text)');
  check((i?.shell.items.find((x) => x.id === 'live')?.tailClass ?? '').includes('dot'), 'the green live dot shows while a room is playing');
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

// ---------------------------------------------------------------- C: signed out
console.log('--- C: signed out');
{
  const r = await run('signed-out', { cookies: 'wewatch-locale=uz', action: 'home-look', startPath: '/login' });
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
  const r = await run('retry', { cookies: 'wewatch-locale=uz;access_token=good;refresh_token=r1', action: 'home-retry', downFor: 1 });
  const a = r.get('retry-initial');
  check(a?.mode === 'home' && a?.home.message === "Xonalarni yuklab bo'lmadi", 'server error: Home shows "Xonalarni yuklab bo\'lmadi" (no crash, no fall-back to login)');
  check(a?.content === null, 'a server error does not load the web page');
  const b = r.get('retry-after');
  check(b?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)', 'after "Qayta urinish" the rooms are shown');
}

// ---------------------------------------------------------------- E: language + subscription
console.log('--- E: language follows the web app; subscription is gone');
{
  const r = await run('lang', { cookies: 'access_token=good;refresh_token=r1', action: 'lang', startPath: '/settings', startWeb: true, ttl: 25 });
  const labels = (x) => (x?.shell.items ?? []).map((i) => i.label).join('|');
  const ru = r.get('lang-ru');
  check(labels(ru) === 'Главная|Комнаты|Прямые эфиры|Друзья|История|Настройки', 'no language cookie -> the web default (Russian): sidebar items');
  check(ru?.shell.titles.join('|') === 'ОСНОВНОЕ|ДРУЗЬЯ И СООБЩЕСТВО|БИБЛИОТЕКА', 'Russian section titles');
  check(ru?.shell.backLabel === 'Назад' && ru?.shell.htmlLang === 'ru', 'Russian button label and page language');
  check(ru?.content?.planSection === 'none', 'the subscription panel (TARIF / Pro / Payme / Click) is hidden on Settings');
  check(ru?.content?.otherSection !== 'none' && ru?.content?.otherSection !== null, 'the other Settings panels are still visible');
  check(ru?.content?.planFetch === 'blocked', "the page's request to the payment API was cancelled");
  check(!r.calls.some((c) => c.includes('/api/payment')), 'the payment API never reached the server');
  check(r.ev.some((x) => x.event === 'payment-blocked'), 'the app logged the blocked payment request');
  const pr = r.get('lang-pricing');
  check(pathOf(pr?.content?.url) === '/settings' && !r.calls.includes('GET /pricing'), '/pricing cannot be opened (stayed on Settings, server never asked)');
  const uz = r.get('lang-uz');
  check(labels(uz) === "Bosh sahifa|Xonalar|Jonli efirlar|Do'stlar|Tarix|Sozlamalar", 'switching the web language to Uzbek changes the sidebar at once');
  check(uz?.shell.titles.join('|') === "ASOSIY|DO'STLAR & HAMJAMIYAT|KUTUBXONA" && uz?.shell.htmlLang === 'uz', 'Uzbek section titles (the approved design)');
  const en = r.get('lang-en');
  check(labels(en) === 'Home|Rooms|Live streams|Friends|History|Settings', 'switching to English changes the sidebar at once');
  check(en?.shell.titles.join('|') === 'MAIN|FRIENDS & COMMUNITY|LIBRARY', 'English section titles');
  const he = r.get('lang-home-en');
  check(he?.mode === 'home', 'the sidebar Xonalar opens the native room list');
  check(he?.home.banner?.kicker === 'LIVE RIGHT NOW' && he?.home.banner?.join === 'Join' && he?.home.banner?.viewers === '9 watching', 'Home banner in English');
  check(he?.home.section === 'Active rooms' && he?.home.cards[0]?.button === 'Join' && he?.home.cards[3]?.button === 'Waiting room', 'Home section and buttons in English');
  check(he?.home.cards.map((c) => c.badge).join('|').startsWith('LIVE|PAUSED') && he?.home.cards[3]?.badge === 'STARTING' && he?.home.cards[0]?.count === '3', 'Home badges and counters in English');
  check(he?.shell.searchPlaceholder === 'Search', 'search box in English');
  const hr = r.get('lang-home-ru');
  check(hr?.home.banner?.kicker === 'СЕЙЧАС В ЭФИРЕ' && hr?.home.banner?.viewers === '9 смотрят' && hr?.home.cards[0]?.count === '3 чел.', 'a language change while Home is shown redraws Home and the sidebar at once (Russian)');
  check(labels(hr) === 'Главная|Комнаты|Прямые эфиры|Друзья|История|Настройки', 'the sidebar followed too');
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
  check(a?.shell.items.find((x) => x.active)?.id === 'rooms' && a?.home.section === 'Faol xonalar', 'the app opens on Xonalar (the design\'s main window)');
  const n = r.get('design-newest');
  check(n?.home.sort.value === 'newest', 'the sort control follows the choice');
  const bad = r.ev.find((x) => x.event === 'design-sort-hostile')?.replies ?? [];
  check(bad.length === 6 && bad.every((x) => x && x.ok === false), 'an unknown sort key is refused (6 of 6)');
  const c = r.get('design-collapsed');
  check(c?.shell.collapsed === true && c?.shell.sidebarVar === '0px' && c?.homeBounds?.x === 0, 'Yon panel button collapses the sidebar: Home moves to the left edge');
  const e = r.get('design-expanded');
  check(e?.shell.collapsed === false && e?.homeBounds?.x === 240, 'and brings it back (240 px)');
  const l = r.get('design-live');
  check(l?.shell.items.find((x) => x.active)?.id === 'live' && JSON.stringify(titles(l?.home)) === JSON.stringify(['Muqaddima', '<img src="https://evil.example/pwn.png" onerror="alert(1)">']) && l?.home.banner?.title === 'Yulduzlar Jangi (Interstellar)', 'Jonli efirlar: only the playing rooms (the waiting and paused ones are left out)');
  const h = r.get('design-history');
  check(h?.shell.items.find((x) => x.active)?.id === 'history' && JSON.stringify(h?.home.gridWatch) === JSON.stringify(['Watched before']), 'Tarix: a grid with the watched videos, no segments/search');
  const hm = r.get('design-home');
  check(hm?.shell.items.find((x) => x.active)?.id === 'home' && hm?.home.rails.length === 2, 'Bosh sahifa = banner + rails');
  const nr = r.get('design-new-room');
  check(nr?.mode === 'web' && pathOf(nr?.content?.url) === '/home' && nr?.content?.dialog === 'NEW-ROOM-DIALOG', '"+ Yangi xona" opens the web app\'s own create-room dialog');
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
  check(r.get('nolive-create')?.content?.dialog === 'NEW-ROOM-DIALOG', '"Xona yaratish" in the start block opens the web create-room dialog');
  check(r.get('nolive-join')?.content?.dialog === 'JOIN-DIALOG', '"Kod bilan kirish" opens the web join dialog'); 
}

server.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
