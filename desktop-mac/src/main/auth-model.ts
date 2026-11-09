// Pure model of the native sign-in screens (login, register + e-mail code, forgot / reset password). No Electron imports,
// so every rule here is unit-tested. The rules, request bodies and error handling are copied from the web app:
//   apps/app-web/src/app/(auth)/login/LoginForm.tsx            POST /api/auth/login            { email, password }
//   apps/app-web/src/app/(auth)/register/RegisterForm.tsx      POST /api/auth/register         { username, email, password }
//   apps/app-web/src/app/(auth)/register/VerifyEmail.tsx       POST /api/auth/register/confirm { email, code }
//   apps/app-web/src/app/(auth)/auth/forgot-password/...       POST /api/auth/forgot-password  { email }
//   apps/app-web/src/app/(auth)/auth/reset-password/...        POST /api/auth/reset-password   { token, newPassword }
// The BFF routes (apps/app-web/src/app/api/auth/*) talk to the auth service and, for login / confirm, set the httpOnly
// access_token / refresh_token cookies — the same cookies a web sign-in leaves behind.

/** shared/src/constants PATTERNS.USERNAME and PATTERNS.PASSWORD (the web form imports them; the backend validates with them). */
export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const PASSWORD_RE = /^[\s\S]{6,128}$/;
export const PASSWORD_MIN = 6;
export const CODE_LENGTH = 6;
export const CODE_RE = /^\d{6}$/;
/** Seconds between two "resend code" presses (the mobile app's VerifyEmailScreen uses the same 60 s). */
export const RESEND_COOLDOWN_S = 60;

// Transport caps for values that come over IPC. They only refuse absurd input; the real rules are the web's.
const MAX_EMAIL = 254;
const MAX_LOGIN_PASSWORD = 1024;
const MAX_USERNAME = 64;
const MAX_MESSAGE = 300;
const RESET_TOKEN_RE = /^[A-Za-z0-9_-]{16,256}$/;

export const authApiUrls = (appUrl: string) => {
  const o = new URL(appUrl).origin;
  return {
    login: `${o}/api/auth/login`,
    register: `${o}/api/auth/register`,
    confirm: `${o}/api/auth/register/confirm`,
    forgot: `${o}/api/auth/forgot-password`,
    reset: `${o}/api/auth/reset-password`,
  } as const;
};

const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

// ---------------------------------------------------------------- validation (what the web form allows to be submitted)

export type RegisterFieldError = 'usernamePattern' | 'passwordMin' | 'passwordPattern';

/** RegisterForm: the username field (the web trims it on every keystroke). Empty = no message yet. */
export function usernameError(username: string): RegisterFieldError | null {
  return username.length > 0 && !USERNAME_RE.test(username) ? 'usernamePattern' : null;
}

/** RegisterForm: "too short" wins over the pattern (the pattern then only catches > 128 characters). */
export function newPasswordError(password: string): RegisterFieldError | null {
  if (password.length > 0 && password.length < PASSWORD_MIN) return 'passwordMin';
  if (password.length > 0 && !PASSWORD_RE.test(password)) return 'passwordPattern';
  return null;
}

export type Strength = 'weak' | 'okay' | 'strong';
/** RegisterForm's strength meter (a hint only, never a block). */
export function passwordStrength(pw: string): Strength | null {
  if (pw.length === 0) return null;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (pw.length >= 12 && variety >= 3) return 'strong';
  if (pw.length >= 6 && variety >= 2) return 'okay';
  return 'weak';
}

export const canLogin = (email: string, password: string): boolean => email !== '' && password !== '';

export const canRegister = (username: string, email: string, password: string): boolean =>
  username !== '' && email !== '' && password !== '' && usernameError(username) === null && newPasswordError(password) === null;

/** ResetPasswordForm: mismatch is shown once the second field has text; too short once the first has text. */
export function resetErrors(password: string, confirm: string): { tooShort: boolean; mismatch: boolean } {
  return { tooShort: password.length > 0 && password.length < PASSWORD_MIN, mismatch: confirm.length > 0 && password !== confirm };
}
export function canReset(password: string, confirm: string): boolean {
  const e = resetErrors(password, confirm);
  return password !== '' && confirm !== '' && !e.tooShort && !e.mismatch;
}

// ---------------------------------------------------------------- request bodies (built in main from checked IPC values)

/** null = the values may not be sent (wrong type, empty, absurdly long). */
export function loginBody(email: unknown, password: unknown): { email: string; password: string } | null {
  if (!isStr(email, MAX_EMAIL) || !isStr(password, MAX_LOGIN_PASSWORD) || !canLogin(email, password)) return null;
  return { email, password };
}

export function registerBody(username: unknown, email: unknown, password: unknown): { username: string; email: string; password: string } | null {
  if (!isStr(username, MAX_USERNAME) || !isStr(email, MAX_EMAIL) || !isStr(password, 128)) return null;
  const u = username.trim();
  return canRegister(u, email, password) ? { username: u, email, password } : null;
}

export function confirmBody(email: unknown, code: unknown): { email: string; code: string } | null {
  if (!isStr(email, MAX_EMAIL) || email === '' || typeof code !== 'string' || !CODE_RE.test(code)) return null;
  return { email, code };
}

export function forgotBody(email: unknown): { email: string } | null {
  return isStr(email, MAX_EMAIL) && email !== '' ? { email } : null;
}

/** The token comes from the reset link the main process itself intercepted; the renderer never sees it. */
export function resetBody(token: unknown, password: unknown, confirm: unknown): { token: string; newPassword: string } | null {
  if (typeof token !== 'string' || !RESET_TOKEN_RE.test(token)) return null;
  if (!isStr(password, 128) || !isStr(confirm, 128) || !canReset(password, confirm)) return null;
  return { token, newPassword: password };
}

export const isResetToken = (t: unknown): t is string => typeof t === 'string' && RESET_TOKEN_RE.test(t);

// ---------------------------------------------------------------- answers -> what the screen shows

/**
 * What a sign-in screen shows after a request. `message` is the server's own text, shown as is (the web does the same);
 * the other kinds name a string of auth-strings.ts.
 */
export type AuthOutcome =
  | { ok: true }
  | { ok: false; kind: 'message'; message: string }
  | { ok: false; kind: 'blocked'; reason: string | null }
  | { ok: false; kind: 'wrongCredentials' | 'genericError' | 'forgotRateLimited' | 'resetFailed' | 'resetNetworkError' | 'invalid' };

/** status 0 = the request never got an answer (offline, DNS, timeout); body null = the answer was not JSON. */
export interface Answer {
  status: number;
  body: unknown;
}

const ok2xx = (s: number): boolean => s >= 200 && s < 300;
const field = (body: unknown, key: string): unknown => (typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined);
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.slice(0, MAX_MESSAGE) : null);
const firstError = (body: unknown): string | null => {
  const e = field(body, 'errors');
  return Array.isArray(e) ? text(e[0]) : null;
};
const msg = (m: string): AuthOutcome => ({ ok: false, kind: 'message', message: m });

/** LoginForm: ACCOUNT_BLOCKED -> the ban notice; else errors[0] ?? message ?? wrongCredentials; no JSON / no answer -> genericError. */
export function classifyLogin(a: Answer): AuthOutcome {
  if (ok2xx(a.status)) return { ok: true };
  if (a.status === 0 || a.body === null || typeof a.body !== 'object') return { ok: false, kind: 'genericError' };
  if (field(a.body, 'code') === 'ACCOUNT_BLOCKED') return { ok: false, kind: 'blocked', reason: text(field(a.body, 'reason')) };
  const m = firstError(a.body) ?? text(field(a.body, 'message'));
  return m ? msg(m) : { ok: false, kind: 'wrongCredentials' };
}

/** RegisterForm (and the resend, which repeats the same request): errors[0] ?? message ?? genericError. */
export function classifyRegister(a: Answer): AuthOutcome {
  if (ok2xx(a.status)) return { ok: true };
  if (a.status === 0 || a.body === null || typeof a.body !== 'object') return { ok: false, kind: 'genericError' };
  const m = firstError(a.body) ?? text(field(a.body, 'message'));
  return m ? msg(m) : { ok: false, kind: 'genericError' };
}

/** VerifyEmail: message ?? genericError. */
export function classifyConfirm(a: Answer): AuthOutcome {
  if (ok2xx(a.status)) return { ok: true };
  if (a.status === 0 || a.body === null || typeof a.body !== 'object') return { ok: false, kind: 'genericError' };
  const m = text(field(a.body, 'message'));
  return m ? msg(m) : { ok: false, kind: 'genericError' };
}

/** ForgotPasswordForm: any 2xx -> "sent" (whether or not the address exists); 429 has its own text. */
export function classifyForgot(a: Answer): AuthOutcome {
  if (a.status === 0) return { ok: false, kind: 'resetNetworkError' };
  if (ok2xx(a.status)) return { ok: true };
  return { ok: false, kind: a.status === 429 ? 'forgotRateLimited' : 'resetFailed' };
}

/** ResetPasswordForm: message ?? resetFailed; an answer that is not JSON lands in the web's catch -> resetNetworkError. */
export function classifyReset(a: Answer): AuthOutcome {
  if (a.status === 0) return { ok: false, kind: 'resetNetworkError' };
  if (ok2xx(a.status)) return { ok: true };
  if (a.body === null || typeof a.body !== 'object') return { ok: false, kind: 'resetNetworkError' };
  const m = text(field(a.body, 'message'));
  return m ? msg(m) : { ok: false, kind: 'resetFailed' };
}

// ---------------------------------------------------------------- web sign-in pages -> the native screen

export type AuthScreen = 'login' | 'register' | 'forgot' | 'reset';

export interface AuthTarget {
  readonly screen: AuthScreen;
  /** Where to go after signing in (`?redirect=` of the page, same-origin path only), or null. */
  readonly redirect: string | null;
  /** /auth/reset-password?token=…: the emailed token (checked), or null. */
  readonly token: string | null;
}

const LOCALE_PREFIX = /^\/(uz|en|ru)(?=\/|$)/;

/** Post-login destination: a plain same-origin path only (`//evil.com` and `/\evil.com` would leave the app). */
export function safeRedirectPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null;
  return raw;
}

/**
 * The web app's own sign-in pages (/login, /register, /auth/forgot-password, /auth/reset-password, any other /auth/...,
 * with or without a /uz|/ru|/en prefix) are never shown in the Mac app: this says which native screen replaces the page.
 * null for everything else, including /guest (joining a shared room with just a name stays the web page).
 */
export function nativeAuthTarget(url: string, appUrl: string): AuthTarget | null {
  let u: URL;
  try {
    u = new URL(url);
    if (u.origin !== new URL(appUrl).origin) return null;
  } catch {
    return null;
  }
  const p = (u.pathname.replace(LOCALE_PREFIX, '') || '/').replace(/\/+$/, '') || '/';
  const under = (r: string): boolean => p === r || p.startsWith(`${r}/`);
  let screen: AuthScreen;
  if (under('/login')) screen = 'login';
  else if (under('/register')) screen = 'register';
  else if (p === '/auth/forgot-password') screen = 'forgot';
  else if (p === '/auth/reset-password') screen = 'reset';
  else if (under('/auth')) screen = 'login';
  else return null;
  const token = screen === 'reset' ? u.searchParams.get('token') : null;
  return { screen, redirect: safeRedirectPath(u.searchParams.get('redirect')), token: isResetToken(token) ? token : null };
}
