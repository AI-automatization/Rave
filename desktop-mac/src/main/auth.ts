import { dialog, net, session, shell, type BrowserWindow } from 'electron';
import { APP_ORIGIN, APP_URL, AUTH_NO_BROWSER, BACKGROUND, AUTH_POLL_MS, AUTH_URL } from './config';
import { classifyPoll, safeRedirect } from './urls';

// Google sign-in NEVER runs inside the app (RFC 8252: no embedded login; Google blocks embedded browsers).
// We reuse the auth service's mobile flow (already in production, no server change needed):
//   1. POST {AUTH}/google/init            → one-time `state`
//   2. open {AUTH}/google/mobile?state=…  in the user's real browser → Google → auth callback stores the
//      tokens under that state and shows "you're signed in" (its link wewatch://auth/callback focuses us)
//   3. we poll GET {AUTH}/google/poll?state=…  (202 = waiting; 200 = tokens, handed out once)
//   4. tokens become the same httpOnly cookies the web app's /api/auth/google/exchange sets, then the
//      main window loads the post-login page — the web app sees a normal logged-in session.

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const ACCESS_TTL_S = 15 * 60; // same as the web app's exchange route
const REFRESH_TTL_S = 30 * 24 * 60 * 60;
const STATE_RE = /^[A-Za-z0-9-]{8,64}$/;

export type Log = (event: string, data?: Record<string, unknown>) => void;

let loginGen = 0; // a newer click cancels the older polling loop

const MSG = {
  initFailed: "Google orqali kirishni boshlab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.",
  failed: "Google orqali kirish amalga oshmadi. Qayta urinib ko'ring.",
  blocked: (reason: string) => `Hisob bloklangan${reason ? `: ${reason}` : ''}`,
} as const;

function showError(win: BrowserWindow, message: string): void {
  if (!win.isDestroyed()) void dialog.showMessageBox(win, { type: 'warning', title: 'WeWatch', message });
}

async function setSessionTokens(accessToken: string, refreshToken?: string): Promise<void> {
  const secure = APP_URL.startsWith('https:');
  const now = Math.floor(Date.now() / 1000);
  const base = { url: APP_URL, path: '/', httpOnly: true, secure, sameSite: 'lax' as const };
  const jar = session.defaultSession.cookies;
  await jar.set({ ...base, name: 'access_token', value: accessToken, expirationDate: now + ACCESS_TTL_S });
  if (refreshToken) {
    await jar.set({ ...base, name: 'refresh_token', value: refreshToken, expirationDate: now + REFRESH_TTL_S });
  }
}

/**
 * `load` opens the post-login page where the web app lives (the content view); `win` is only used for dialogs and focus.
 * Defaults to the window's own page for callers without a separate content view.
 */
/** How a Google sign-in ended (the native sign-in screen shows the failures itself; other callers get a dialog). */
export type GoogleResult = { kind: 'ok' } | { kind: 'blocked'; reason: string } | { kind: 'error' } | { kind: 'cancelled' };

/** The user gave up waiting (native sign-in screen): the polling loop stops at its next step. */
export function cancelBrowserLogin(): void {
  loginGen++;
}

export async function startBrowserLogin(
  rawRedirect: unknown,
  win: BrowserWindow,
  log: Log = () => {},
  load: (url: string) => Promise<void> = (u) => win.loadURL(u),
  dialogs = true,
): Promise<GoogleResult> {
  const fail = (m: string): void => {
    if (dialogs) showError(win, m);
  };
  const gen = ++loginGen;
  const redirect = safeRedirect(rawRedirect, '/home');

  let state: string;
  try {
    const r = await net.fetch(`${AUTH_URL}/google/init`, { method: 'POST', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const s = ((await r.json()) as { data?: { state?: unknown } } | null)?.data?.state;
    if (!r.ok || typeof s !== 'string' || !STATE_RE.test(s)) throw new Error(`init ${r.status}`);
    state = s;
  } catch (e) {
    log('login-init-failed', { error: String(e) });
    fail(MSG.initFailed);
    return { kind: 'error' };
  }

  const browserUrl = `${AUTH_URL}/google/mobile?state=${encodeURIComponent(state)}`;
  log('login-browser', { opened: !AUTH_NO_BROWSER, host: new URL(browserUrl).host });
  if (!AUTH_NO_BROWSER) void shell.openExternal(browserUrl);

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  while (gen === loginGen && Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, AUTH_POLL_MS));
    if (gen !== loginGen || win.isDestroyed()) return { kind: 'cancelled' };

    let outcome;
    try {
      const r = await net.fetch(`${AUTH_URL}/google/poll?state=${encodeURIComponent(state)}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      outcome = r.status === 202 ? classifyPoll(202, null) : classifyPoll(r.status, await r.json().catch(() => null));
    } catch {
      continue; // network blip — keep waiting until the deadline
    }

    if (outcome.kind === 'pending') continue;
    if (outcome.kind === 'blocked') {
      log('login-blocked');
      fail(MSG.blocked(outcome.reason));
      return { kind: 'blocked', reason: outcome.reason };
    }
    if (outcome.kind === 'error') {
      log('login-error');
      fail(MSG.failed);
      return { kind: 'error' };
    }

    await setSessionTokens(outcome.accessToken, outcome.refreshToken);
    log('login-success', { redirect, hasRefresh: !!outcome.refreshToken }); // never log tokens
    const dest = new URL(redirect, APP_URL);
    load(dest.origin === APP_ORIGIN ? dest.toString() : new URL('/home', APP_URL).toString()).catch(() => {});
    if (!BACKGROUND) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
    return { kind: 'ok' };
  }
  return { kind: gen === loginGen ? 'error' : 'cancelled' }; // waited 5 minutes without an answer, or cancelled
}
