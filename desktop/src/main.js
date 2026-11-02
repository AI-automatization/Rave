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

const { app, BrowserWindow, session, ipcMain, desktopCapturer, shell, net, dialog } = require('electron');
const path = require('node:path');
const { configureDns, protectSession, checkUrl } = require('./safety');

const APP_URL = process.env.WW_APP_URL || 'https://app.wewatch.uz';
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
const AUTH_URL = (process.env.WW_AUTH_URL || 'https://auth-production-47a8.up.railway.app/api/v1/auth').replace(/\/+$/, '');
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
const sendToApp = (ch, payload) => mainWin?.webContents.send(ch, payload);

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
      partition: 'persist:vb',     // own cookies/cache — never touches the user's Chrome or the app session
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // keep rendering while minimized/behind other windows — viewers still watch
      spellcheck: false,
    },
  });
  vbWin.setMenuBarVisibility(false);
  // Popups / target=_blank open in the same VB window — no stray windows or processes.
  vbWin.webContents.setWindowOpenHandler(({ url: u }) => {
    if (!checkUrl(u)) vbWin.loadURL(u);
    return { action: 'deny' };
  });
  vbWin.webContents.on('did-navigate', (_e, u) => sendToApp('vb:state', { open: true, url: u }));
  vbWin.webContents.on('page-title-updated', (_e, title) => sendToApp('vb:state', { open: true, url: vbWin.webContents.getURL(), title }));
  vbWin.webContents.on('render-process-gone', (_e, d) => sendToApp('vb:state', { open: true, crashed: d.reason }));
  vbWin.on('closed', () => { vbWin = null; sendToApp('vb:state', { open: false }); });
  vbWin.loadURL(url);
  return { ok: true };
}

function closeVb() {
  if (vbWin && !vbWin.isDestroyed()) vbWin.close();
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

  mainWin.on('closed', () => { mainWin = null; closeVb(); app.quit(); });
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
