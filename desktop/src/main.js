// WeWatch for Windows.
//
// The main window is the regular web app (app.wewatch.uz) — same code, same accounts, same rooms,
// so web/mobile users and desktop users meet in one room. The desktop app adds ONE capability the
// browser can't give: a Virtual Browser that runs on the owner's own machine instead of our server.
//
// Flow: the web app (in a room) calls window.wewatchDesktop.vb.open(url) → we open a separate VB
// window (own Chromium profile, filtered for 18+) → the web app calls the ordinary
// navigator.mediaDevices.getDisplayMedia() → our handler answers with exactly that VB window plus
// system audio → the web app sends the stream to viewers over WebRTC (watch-party only relays the
// signalling). No server Chromium, no frame relay through our servers.

const { app, BrowserWindow, WebContentsView, session, ipcMain, desktopCapturer, shell, net, dialog } = require('electron');
const path = require('node:path');
const { configureDns, protectSession, checkUrl } = require('./safety');

// With our secure DNS (safety.js) Chromium also reads the HTTPS/SVCB records of Cloudflare-fronted
// hosts (alpn=h3,h2 + ECH keys) and changes how it connects. The room websocket to stream.wewatch.uz
// then died with ERR_CONNECTION_RESET, while the same app on system DNS connected (checked 2026-11-02;
// turning off only ECH/post-quantum TLS did not help). Ignoring those records keeps the DoH filter.
app.commandLine.appendSwitch('disable-features', 'UseDnsHttpsSvcbAlpn,UseDnsHttpsSvcb');

// WW_APP_URL / WW_AUTH_URL are for `npm run dev` only. The installed app always opens production: a
// WW_APP_URL left in the Windows user environment sent it to localhost:3000 (2026-11-05).
const DEV_ENV = (name) => (app.isPackaged ? '' : process.env[name] || '');
const APP_URL = DEV_ENV('WW_APP_URL') || 'https://app.wewatch.uz';
const APP_ORIGIN = new URL(APP_URL).origin;
// Hosts the main window may navigate to without leaving for the system browser.
const IN_APP_HOSTS = new Set([new URL(APP_URL).hostname, 'wewatch.uz', 'www.wewatch.uz']);

// Google sign-in NEVER runs inside the app (RFC 8252: no embedded login; Google blocks embedded
// browsers and Chromium-in-Electron pops the Windows Security passkey dialog). We reuse the auth
// service's existing mobile flow (already in production, no server change needed):
//   1. POST {AUTH}/google/init              → one-time `state` (stored in Redis as pending)
//   2. open {AUTH}/google/mobile?state=… in the user's real browser → Google → auth callback,
//      which stores the tokens under that state and shows "you're signed in, return to the app"
//   3. the app polls GET {AUTH}/google/poll?state=… (202 = still waiting; 200 = tokens, read once)
//   4. tokens go into the app session as the same httpOnly cookies /api/auth/google/exchange sets,
//      then the main window reloads — the web app sees a normal logged-in session.
// The state never leaves this process + the browser tab, and poll hands the result out only once.
const GOOGLE_START_PATH = '/api/auth/google/start';
const AUTH_URL = (DEV_ENV('WW_AUTH_URL') || 'https://auth-production-47a8.up.railway.app/api/v1/auth').replace(/\/+$/, '');
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const ACCESS_TTL_S = 15 * 60;           // same as exchange/route.ts
const REFRESH_TTL_S = 30 * 24 * 60 * 60;
let loginGen = 0; // a newer click cancels the older polling loop

async function setSessionTokens({ accessToken, refreshToken }) {
  const secure = APP_URL.startsWith('https:');
  const now = Math.floor(Date.now() / 1000);
  const base = { url: APP_URL, path: '/', httpOnly: true, secure, sameSite: 'lax' };
  await session.defaultSession.cookies.set({ ...base, name: 'access_token', value: accessToken, expirationDate: now + ACCESS_TTL_S });
  if (refreshToken) {
    await session.defaultSession.cookies.set({ ...base, name: 'refresh_token', value: refreshToken, expirationDate: now + REFRESH_TTL_S });
  }
}

function loginError(message) {
  if (mainWin) dialog.showMessageBox(mainWin, { type: 'warning', title: 'WeWatch', message });
}

async function startBrowserLogin(redirect) {
  const gen = ++loginGen;
  let state;
  try {
    const r = await net.fetch(`${AUTH_URL}/google/init`, { method: 'POST' });
    state = (await r.json())?.data?.state;
    if (!r.ok || typeof state !== 'string') throw new Error(`init ${r.status}`);
  } catch {
    loginError('Не удалось начать вход через Google. Проверьте интернет и попробуйте ещё раз.');
    return;
  }
  shell.openExternal(`${AUTH_URL}/google/mobile?state=${encodeURIComponent(state)}`);

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  while (gen === loginGen && Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
    if (gen !== loginGen) return;
    let r, body;
    try {
      r = await net.fetch(`${AUTH_URL}/google/poll?state=${encodeURIComponent(state)}`, { cache: 'no-store' });
      if (r.status === 202) continue;
      body = await r.json();
    } catch { continue; } // network blip — keep waiting until the deadline
    const data = body?.data;
    if (!r.ok || !data) { loginError('Вход через Google не удался. Попробуйте ещё раз.'); return; }
    if (data.error === 'ACCOUNT_BLOCKED') { loginError(`Аккаунт заблокирован: ${data.reason || ''}`.trim()); return; }
    if (typeof data.accessToken !== 'string') { loginError('Вход через Google не удался. Попробуйте ещё раз.'); return; }
    await setSessionTokens(data);
    if (!mainWin) return;
    mainWin.loadURL(new URL(redirect && redirect.startsWith('/') ? redirect : '/home', APP_URL).toString());
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.show(); mainWin.focus();
    return;
  }
}

// Sites inside the VB shouldn't see "Electron" either (some refuse to play for unknown browsers).
const CHROME_UA = (ua) => ua.replace(/\s(Electron|wewatch-desktop|WeWatch)\/\S+/gi, '');

// One instance only: a second launch (or a wewatch:// link) focuses the running app.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
// In dev (`electron .`) Windows must be told which app folder to launch for wewatch:// links.
if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient('wewatch', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('wewatch');
}

let mainWin = null;
let vbWin = null;

const isAppOrigin = (url) => { try { return new URL(url).origin === APP_ORIGIN; } catch { return false; } };
// Last two host labels (three for co.uk / com.ua-style hosts) — enough to tell youtube.com from an
// ad network without shipping the public suffix list.
const SECOND_LEVEL = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac']);
const siteOf = (url) => {
  try {
    const labels = new URL(url).hostname.toLowerCase().split('.');
    const n = labels.length >= 3 && SECOND_LEVEL.has(labels[labels.length - 2]) && labels[labels.length - 1].length === 2 ? 3 : 2;
    return labels.slice(-n).join('.');
  } catch { return ''; }
};
const sameSite = (a, b) => { const s = siteOf(a); return !!s && s === siteOf(b); };
const sendToApp = (ch, payload) => mainWin?.webContents.send(ch, payload);

const VB_PREFS = {
  partition: 'persist:vb', // own cookies/cache — never touches the user's Chrome or the app session
  sandbox: true,
  contextIsolation: true,
  nodeIntegration: false,
  spellcheck: false,
};

// A failed page load leaves the view black (Electron has no built-in error page), which read as our
// bug (lv.kinogo.ec reset by the provider, 2026-11-05) — show what failed instead.
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const failPage = (url, code) => {
  let host = url;
  try { host = new URL(url).hostname; } catch { /* keep the raw url */ }
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(
    '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;'
    + 'background:#0b0b0f;color:#ddd;font:15px system-ui,sans-serif;text-align:center"><div>'
    + `<div style="font-size:18px;margin-bottom:8px">${escHtml(host)} — сайт не открылся / sayt ochilmadi</div>`
    + `<div style="opacity:.6">${escHtml(code)}</div></div>`);
};

// Shared by the VB window and the in-app picker — both browse arbitrary sites in persist:vb.
function wireVbContents(wc, channel) {
  // Our own error page is not a page the user picked — keep it out of the app's state.
  const send = (p) => { if (!/^data:/i.test(p.url || '')) sendToApp(channel, p); };
  wc.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    // -3 ERR_ABORTED: a redirect, our own cancel, a newer load. data: = the error page itself failed —
    // loading it again would loop.
    if (!isMainFrame || code === -3 || /^data:/i.test(url)) return;
    wc.loadURL(failPage(url, desc)).catch(() => {});
  });
  // Popups / target=_blank open in the same view — no stray windows or processes. Only within the
  // same site: free movie sites fire window.open() to an ad domain on the first click (popunder),
  // and following it threw the user off the film onto the ad.
  wc.setWindowOpenHandler(({ url: u }) => {
    if (!checkUrl(u) && sameSite(u, wc.getURL())) wc.loadURL(u);
    return { action: 'deny' };
  });
  // nav: 'load' = a real page load, 'in-page' = SPA route change (YouTube/VK switch videos without
  // reloading, did-navigate never fires there). The app's video picker needs both.
  wc.on('did-navigate', (_e, u) => send({ open: true, url: u, nav: 'load' }));
  wc.on('did-navigate-in-page', (_e, u, isMainFrame) => {
    if (isMainFrame) send({ open: true, url: u, nav: 'in-page' });
  });
  wc.on('page-title-updated', (_e, title) => send({ open: true, url: wc.getURL(), title }));
  wc.on('render-process-gone', (_e, d) => send({ open: true, crashed: d.reason }));
}

// ── In-app picker: the VB as a panel inside the main window ───────────────
// Finding the room's video (create room / change video) happens inside WeWatch, not in a second
// window. The web app draws its own toolbar and leaves an empty box, reports where the box is, and we
// lay this view over it. Its own view, not the shared VB window: picking the next video in a room
// must never touch the stream the viewers are watching.
let pickView = null;
const pickContents = () => (pickView && !pickView.webContents.isDestroyed() ? pickView.webContents : null);
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

function openPick(url) {
  const reason = checkUrl(url);
  if (reason) return { ok: false, reason };
  if (!mainWin || mainWin.isDestroyed()) return { ok: false, reason: 'no-window' };
  if (!pickContents()) {
    pickView = new WebContentsView({ webPreferences: { ...VB_PREFS } });
    pickView.setBackgroundColor('#000000');
    pickView.setVisible(false); // until the app reports where its box is
    mainWin.contentView.addChildView(pickView);
    wireVbContents(pickView.webContents, 'pick:state');
    // Streams of the previous page are not this page's film.
    pickView.webContents.on('did-navigate', () => sniffed.clear());
  }
  const wc = pickContents();
  wc.loadURL(url).catch(() => {}); // aborted by a redirect / blocked ad — the page events tell the rest
  wc.focus();
  return { ok: true };
}

/** b = the app's box in CSS px of the main window; null / empty hides the view. */
function setPickBounds(b) {
  if (!pickView || !mainWin || mainWin.isDestroyed()) return { ok: false };
  const valid = b && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(b[k])) && b.width >= 1 && b.height >= 1;
  if (!valid) { pickView.setVisible(false); return { ok: true }; }
  const z = mainWin.webContents.getZoomFactor();
  const [cw, ch] = mainWin.getContentSize();
  const x = clamp(Math.round(b.x * z), 0, cw);
  const y = clamp(Math.round(b.y * z), 0, ch);
  pickView.setBounds({ x, y, width: clamp(Math.round(b.width * z), 0, cw - x), height: clamp(Math.round(b.height * z), 0, ch - y) });
  pickView.setVisible(true);
  return { ok: true };
}

function pickNav(action) {
  const wc = pickContents();
  if (!wc) return { ok: false };
  if (action === 'back' && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
  else if (action === 'reload') wc.reload();
  return { ok: true };
}

// "Take video": the frame where a video actually started. Film sites play the movie inside a player
// iframe (often another domain) — that iframe's URL is the player alone, without the site's banners
// and popunders around it. The longest started video wins: pre-roll ads are short, a live stream is
// Infinity. Nothing started → the page itself, as before.
const PLAYER_PROBE = `(() => {
  let best = 0;
  for (const v of document.querySelectorAll('video')) {
    if (v.currentTime > 0 || !v.paused) best = Math.max(best, Number.isFinite(v.duration) ? v.duration : 1e9);
  }
  return best;
})()`;
const PROBE_TIMEOUT_MS = 1500;

// ── Stream sniffer: the film itself, not just its player page ─────────────
// Film players feed <video> through MSE (currentSrc = blob:), so the stream is only visible on the
// network. Every playlist / video file the picker's page loads is noted with the frame that asked
// for it; "Take video" measures them (a pre-roll ad lasts seconds, the film an hour) and returns the
// longest, which the room then plays in our own synced player. onBeforeRequest belongs to safety.js
// (one listener per event per session) — this one listens on onResponseStarted.
const STREAM_CONTENT_TYPES = [[/mpegurl/i, 'hls'], [/dash\+xml/i, 'dash'], [/^video\/mp4/i, 'mp4']];
const STREAM_EXTENSIONS = [[/\.m3u8$/i, 'hls'], [/\.mpd$/i, 'dash'], [/\.(mp4|m4v)$/i, 'mp4']];
const MAX_STREAMS = 40;
const MAX_STREAM_URL = 4096;       // the server's limit for the stream link
const MAX_MEASURED = 12;           // playlists fetched again on "Take" — the newest, player frame first
const MEASURE_TIMEOUT_MS = 4000;
const MIN_STREAM_SEC = 120;        // shorter = an ad or a trailer, not what the room came to watch
// A progressive file is measured by size; 1 Mbit/s is low for a film, so the estimate errs long.
const MP4_BYTES_PER_SEC = 125_000;
// fMP4 segments of HLS/DASH are video/mp4 too, loaded by script; a file <video> plays is 'media'.
const BIG_MP4_BYTES = 100 * 1024 * 1024;
const sniffed = new Map(); // url → { url, type, frameId, bytes, at }

const headerOf = (headers, name) => {
  const key = Object.keys(headers || {}).find((k) => k.toLowerCase() === name);
  return key ? String([].concat(headers[key])[0] ?? '') : '';
};

function streamTypeOf(url, headers) {
  const ct = headerOf(headers, 'content-type');
  if (/text\/html/i.test(ct)) return null; // an error page under a .m3u8 name
  const byType = STREAM_CONTENT_TYPES.find(([re]) => re.test(ct));
  if (byType) return byType[1];
  let pathname;
  try { pathname = new URL(url).pathname; } catch { return null; }
  return STREAM_EXTENSIONS.find(([re]) => re.test(pathname))?.[1] ?? null;
}

/** Full size of the file: "bytes 0-1/123" for a range answer, content-length otherwise. */
function totalBytes(headers) {
  const range = headerOf(headers, 'content-range');
  const total = Number(range ? range.split('/')[1] : headerOf(headers, 'content-length'));
  return Number.isFinite(total) && total > 0 ? total : 0;
}

function noteStream(d) {
  const wc = pickContents();
  if (!wc || d.webContentsId !== wc.id || (d.statusCode !== 200 && d.statusCode !== 206)) return;
  if (!/^https?:/i.test(d.url) || d.url.length > MAX_STREAM_URL) return;
  const type = streamTypeOf(d.url, d.responseHeaders);
  if (!type) return;
  const bytes = totalBytes(d.responseHeaders);
  if (type === 'mp4' && d.resourceType !== 'media' && bytes < BIG_MP4_BYTES) return;
  let frameId = null;
  try { frameId = d.frame ? d.frame.frameTreeNodeId : null; } catch { /* the frame is already gone */ }
  const prev = sniffed.get(d.url);
  sniffed.delete(d.url); // re-insert = newest
  sniffed.set(d.url, { url: d.url, type, frameId: frameId ?? prev?.frameId ?? null, bytes: Math.max(bytes, prev?.bytes || 0), at: Date.now() });
  if (sniffed.size > MAX_STREAMS) sniffed.delete(sniffed.keys().next().value);
}

// Runs INSIDE the frame that loaded the stream (same origin, cookies and Referer the player had),
// stringified — so it must stay self-contained. Seconds of video: HLS = sum of #EXTINF (a master
// playlist by its first variant), DASH = mediaPresentationDuration; -1 = live (no end).
async function measureStreamInPage(u, type, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  // First the way players load it (hls.js: no cookies): CDNs answer `Access-Control-Allow-Origin: *`,
  // and a credentialed fetch is refused under that — every measure failed on test-streams.mux.dev
  // (live check 2026-11-05). Cookies only as the fallback for a CDN that needs them.
  const get = async (x) => {
    let r = await fetch(x, { signal: ctl.signal }).catch(() => null);
    if (!r || !r.ok) r = await fetch(x, { credentials: 'include', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    return r.text();
  };
  try {
    let body = await get(u);
    if (type === 'dash') {
      if (/type=["']dynamic["']/.test(body)) return { sec: -1, master: true };
      const m = body.match(/mediaPresentationDuration=["']P(?:([\d.]+)D)?(?:T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?)?["']/);
      if (!m) return { sec: 0, master: true };
      return { sec: (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0), master: true };
    }
    let master = false;
    if (body.includes('#EXT-X-STREAM-INF')) {
      master = true;
      const lines = body.split(/\r?\n/).map((s) => s.trim());
      const at = lines.findIndex((s) => s.startsWith('#EXT-X-STREAM-INF'));
      const variant = lines.slice(at + 1).find((s) => s && !s.startsWith('#'));
      if (!variant) return { sec: 0, master };
      body = await get(new URL(variant, u).href);
    }
    if (!body.includes('#EXT-X-ENDLIST') && !/#EXT-X-PLAYLIST-TYPE:\s*VOD/i.test(body)) return { sec: -1, master };
    let sec = 0;
    for (const m of body.matchAll(/#EXTINF:\s*([\d.]+)/g)) sec += Number(m[1]) || 0;
    return { sec, master };
  } catch {
    return { sec: 0, master: false };
  } finally {
    clearTimeout(timer);
  }
}

/** The longest sniffed stream, the taken player's own first. null = nothing long enough was seen. */
async function pickStream(wc, playerFrame) {
  if (!sniffed.size) return null;
  const idOf = (f) => { try { return f.frameTreeNodeId; } catch { return null; } };
  const byId = new Map(wc.mainFrame.framesInSubtree.map((f) => [idOf(f), f]));
  let inPlayer = new Set();
  try { if (playerFrame) inPlayer = new Set(playerFrame.framesInSubtree.map(idOf)); } catch { /* frame gone */ }
  const list = [...sniffed.values()].map((s) => ({ ...s, inPlayer: inPlayer.has(s.frameId) ? 1 : 0, sec: 0, master: 0 }));
  const playlists = list.filter((s) => s.type !== 'mp4')
    .sort((a, b) => (b.inPlayer - a.inPlayer) || (b.at - a.at))
    .slice(0, MAX_MEASURED);
  await Promise.all(playlists.map(async (s) => {
    const f = byId.get(s.frameId) || playerFrame || wc.mainFrame;
    const js = `(${measureStreamInPage})(${JSON.stringify(s.url)}, ${JSON.stringify(s.type)}, ${MEASURE_TIMEOUT_MS})`;
    const r = await Promise.race([
      Promise.resolve().then(() => f.executeJavaScript(js)).catch(() => null),
      new Promise((res) => setTimeout(() => res(null), MEASURE_TIMEOUT_MS + 500)),
    ]);
    s.sec = Number(r?.sec) || 0;
    s.master = r?.master ? 1 : 0;
  }));
  for (const s of list) if (s.type === 'mp4') s.sec = s.bytes / MP4_BYTES_PER_SEC;
  const isLive = (s) => s.sec < 0;
  const long = list.filter((s) => isLive(s) || s.sec >= MIN_STREAM_SEC);
  if (!long.length) return null;
  // 10 s buckets: a master and its variants have the same length — the master wins (all qualities).
  const len = (s) => (isLive(s) ? Infinity : Math.round(s.sec / 10));
  long.sort((a, b) => (b.inPlayer - a.inPlayer) || (len(b) - len(a)) || (b.master - a.master) || (b.at - a.at));
  const best = long[0];
  return { url: best.url, type: best.type, durationSec: isLive(best) ? null : Math.round(best.sec) };
}

async function takePick() {
  const wc = pickContents();
  if (!wc) return { ok: false };
  const probe = (f) => Promise.race([
    f.executeJavaScript(PLAYER_PROBE).then((d) => Number(d) || 0, () => 0),
    new Promise((res) => setTimeout(() => res(0), PROBE_TIMEOUT_MS)),
  ]);
  const frames = wc.mainFrame.framesInSubtree;
  const durations = await Promise.all(frames.map(probe));
  let best = -1;
  durations.forEach((d, i) => { if (d > 0 && (best < 0 || d > durations[best])) best = i; });
  let frame = best >= 0 ? frames[best] : wc.mainFrame;
  // A srcdoc / about:blank player has no address of its own — take the page that hosts it.
  while (frame.parent && !/^https?:/i.test(frame.url)) frame = frame.parent;
  const url = /^https?:/i.test(frame.url) ? frame.url : wc.getURL();
  const reason = checkUrl(url);
  if (reason) return { ok: false, reason };
  // pageUrl = the site page the player sits on: the server opens the player with it as Referer
  // (some player hosts 404 without one — cinemar.cc on kinogo). stream = the film's own playlist /
  // file seen on the network (absent when nothing long enough played).
  const stream = await pickStream(wc, best >= 0 ? frame : null);
  return {
    ok: true, url, pageUrl: wc.getURL(), title: wc.getTitle(), player: best >= 0, frame: frame !== wc.mainFrame,
    ...(stream ? { stream } : {}),
  };
}

function closePick() {
  const v = pickView;
  if (!v) return;
  pickView = null;
  sniffed.clear();
  if (mainWin && !mainWin.isDestroyed()) mainWin.contentView.removeChildView(v);
  if (!v.webContents.isDestroyed()) v.webContents.close();
  sendToApp('pick:state', { open: false });
  if (!vbWin) clearVbCache(); // the room's VB window may still be playing from the same cache
}

// ── Virtual Browser window ─────────────────────────────────────────────────
function openVb(url) {
  const reason = checkUrl(url);
  if (reason) return { ok: false, reason };
  if (vbWin && !vbWin.isDestroyed()) {
    vbWin.loadURL(url);
    vbWin.focus();
    return { ok: true };
  }
  vbWin = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'WeWatch — Virtual Browser',
    backgroundColor: '#000000',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      ...VB_PREFS,
      backgroundThrottling: false, // keep rendering while minimized/behind other windows — viewers still watch
    },
  });
  vbWin.setMenuBarVisibility(false);
  wireVbContents(vbWin.webContents, 'vb:state');
  vbWin.on('closed', () => {
    vbWin = null;
    sendToApp('vb:state', { open: false });
    if (!pickView) clearVbCache();
    if (mainWin && !mainWin.isDestroyed()) mainWin.focus();
  });
  vbWin.loadURL(url);
  return { ok: true };
}

function closeVb() {
  if (vbWin && !vbWin.isDestroyed()) vbWin.close();
}

// The VB is only there to get the video on screen. Players in it fill the HTTP cache (and some the
// Cache API) with video segments, and persist:vb kept them on the user's disk for good. Dropped when
// the VB closes and on start (in case the app was killed); cookies/logins on those sites stay.
function clearVbCache() {
  const vb = session.fromPartition('persist:vb');
  vb.clearCache().catch(() => {});
  vb.clearStorageData({ storages: ['cachestorage', 'shadercache'] }).catch(() => {});
}

// ── Main window (the web app) ──────────────────────────────────────────────
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'WeWatch',
    backgroundColor: '#0b0b0f',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWin.setMenuBarVisibility(false);

  // Anything outside WeWatch opens in the system browser — the app window only ever shows our site.
  const keepInApp = (url) => { try { return IN_APP_HOSTS.has(new URL(url).hostname); } catch { return false; } };
  const isGoogleStart = (url) => { try { const u = new URL(url); return u.origin === APP_ORIGIN && u.pathname === GOOGLE_START_PATH; } catch { return false; } };
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (!keepInApp(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // will-redirect too: the login button goes to our own /api/auth/google/start, which 302s to Google.
  const leaveApp = (e, url, isMainFrame = true) => {
    if (!isMainFrame) return;
    if (isGoogleStart(url)) {
      e.preventDefault();
      startBrowserLogin(new URL(url).searchParams.get('redirect'));
      return;
    }
    if (!keepInApp(url)) { e.preventDefault(); shell.openExternal(url); }
  };
  mainWin.webContents.on('will-navigate', (e, url) => leaveApp(e, url));
  mainWin.webContents.on('will-redirect', (e, url, _inPlace, isMainFrame) => leaveApp(e, url, isMainFrame));

  // A full reload / leaving the app page drops the web app's picker UI — the view must not stay on top.
  mainWin.webContents.on('did-navigate', () => closePick());
  mainWin.on('closed', () => { pickView = null; mainWin = null; closeVb(); app.quit(); });
  mainWin.loadURL(APP_URL);
}

// wewatch://room/<id> → open that room; wewatch://auth/callback → just focus (login is finished by polling).
function handleDeepLink(link) {
  if (!link || !link.startsWith('wewatch://') || !mainWin) return;
  let u;
  try { u = new URL(link); } catch { return; }
  const route = (u.host + u.pathname).replace(/\/+$/, '');
  // wewatch://auth/callback (from the auth success page) only needs the focus below —
  // the polling loop in startBrowserLogin finishes the login itself.
  if (/^room\/[\w-]+$/.test(route)) {
    mainWin.loadURL(`${APP_URL}/${route}`);
  }
  if (mainWin.isMinimized()) mainWin.restore();
  mainWin.focus();
}

app.on('second-instance', (_e, argv) => {
  if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus(); }
  handleDeepLink(argv.find((a) => a.startsWith('wewatch://')));
});

app.whenReady().then(() => {
  configureDns(app);
  app.userAgentFallback = CHROME_UA(app.userAgentFallback);
  session.defaultSession.setUserAgent(CHROME_UA(session.defaultSession.getUserAgent()));
  session.fromPartition('persist:vb').setUserAgent(CHROME_UA(session.fromPartition('persist:vb').getUserAgent()));
  protectSession(session.fromPartition('persist:vb'), (url, reason) => sendToApp('vb:blocked', { url, reason }));
  session.fromPartition('persist:vb').webRequest.onResponseStarted(noteStream);
  clearVbCache();

  // Every refresh rotates refresh_token — the old one is deleted on the server. Chromium writes
  // cookies to disk lazily (~30 s), so a crash, a kill from Task Manager or a power cut right after
  // a refresh restarted the app with the already-dead token: refresh 401 → logged out. Write the
  // session cookies through to disk the moment they change.
  session.defaultSession.cookies.on('changed', (_e, cookie) => {
    if (cookie.name === 'refresh_token' || cookie.name === 'access_token') {
      session.defaultSession.cookies.flushStore().catch(() => {});
    }
  });

  // The web app's getDisplayMedia() gets the VB window + system audio. Nothing else can be shared
  // from inside the app: no VB window → the request is refused.
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    if (!vbWin || !isAppOrigin(request.securityOrigin || request.frame?.url || '')) { callback({}); return; }
    const sources = await desktopCapturer.getSources({ types: ['window'] });
    const source = sources.find((s) => s.id === vbWin.getMediaSourceId());
    callback(source ? { video: source, audio: 'loopback' } : {});
  });

  // The bridge is only served to our own origin — a foreign page in the main window gets nothing.
  const guard = (handler) => (event, ...args) => {
    if (!isAppOrigin(event.senderFrame?.url || '')) return { ok: false, reason: 'forbidden' };
    return handler(...args);
  };
  ipcMain.handle('vb:open', guard((url) => openVb(String(url))));
  ipcMain.handle('vb:close', guard(() => { closeVb(); return { ok: true }; }));
  ipcMain.handle('vb:focus', guard(() => { vbWin?.focus(); return { ok: !!vbWin }; }));
  ipcMain.handle('pick:open', guard((url) => openPick(String(url))));
  ipcMain.handle('pick:bounds', guard((b) => setPickBounds(b && typeof b === 'object' ? b : null)));
  ipcMain.handle('pick:nav', guard((action) => pickNav(String(action))));
  ipcMain.handle('pick:take', guard(() => takePick()));
  ipcMain.handle('pick:close', guard(() => { closePick(); return { ok: true }; }));
  ipcMain.handle('vb:metrics', guard(() => {
    const m = app.getAppMetrics();
    return {
      ramMb: Math.round(m.reduce((s, p) => s + (p.memory.workingSetSize || 0), 0) / 1024),
      cpu: Math.round(m.reduce((s, p) => s + (p.cpu.percentCPUUsage || 0), 0)),
      processes: m.length,
    };
  }));

  createMainWindow();
  handleDeepLink(process.argv.find((a) => a.startsWith('wewatch://')));

  // Auto-update from GitHub Releases (only in the packaged app).
  if (app.isPackaged) {
    try { require('electron-updater').autoUpdater.checkForUpdatesAndNotify(); } catch { /* offline — next launch */ }
  }
});

app.on('window-all-closed', () => app.quit());
