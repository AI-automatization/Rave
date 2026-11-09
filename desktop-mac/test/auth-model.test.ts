import { describe, expect, it } from 'vitest';
import {
  authApiUrls, canLogin, canRegister, canReset, classifyConfirm, classifyForgot, classifyLogin, classifyRegister, classifyReset, confirmBody, forgotBody, loginBody,
  nativeAuthTarget, newPasswordError, passwordStrength, registerBody, resetBody, resetErrors, safeRedirectPath, usernameError, CODE_LENGTH, RESEND_COOLDOWN_S,
} from '../src/main/auth-model';

const APP = 'https://app.wewatch.uz/home';

describe('authApiUrls — the web app\'s own BFF routes, always on the app origin', () => {
  it('builds every URL from the origin only', () => {
    expect(authApiUrls(APP)).toEqual({
      login: 'https://app.wewatch.uz/api/auth/login',
      register: 'https://app.wewatch.uz/api/auth/register',
      confirm: 'https://app.wewatch.uz/api/auth/register/confirm',
      forgot: 'https://app.wewatch.uz/api/auth/forgot-password',
      reset: 'https://app.wewatch.uz/api/auth/reset-password',
    });
    expect(authApiUrls('http://localhost:3110/home?x=1').login).toBe('http://localhost:3110/api/auth/login');
  });
});

describe('validation — identical to the web forms (shared PATTERNS)', () => {
  it('login: both fields non-empty, nothing else (LoginForm)', () => {
    expect(canLogin('a', 'b')).toBe(true);
    expect(canLogin('', 'b')).toBe(false);
    expect(canLogin('a', '')).toBe(false);
  });
  it('username: 3–20 latin letters, digits, _ ; empty shows nothing yet', () => {
    expect(usernameError('')).toBeNull();
    for (const ok of ['abc', 'A_b_9', 'x'.repeat(20)]) expect(usernameError(ok)).toBeNull();
    for (const bad of ['ab', 'x'.repeat(21), 'a b', 'ali-vali', 'Алиш', 'o‘g‘il']) expect(usernameError(bad)).toBe('usernamePattern');
  });
  it('new password: 6–128 any characters; "too short" first, the pattern only beyond 128', () => {
    expect(newPasswordError('')).toBeNull();
    expect(newPasswordError('12345')).toBe('passwordMin');
    expect(newPasswordError('123456')).toBeNull();
    expect(newPasswordError('      ')).toBeNull(); // simple passwords are allowed (2026-10-25)
    expect(newPasswordError('x'.repeat(128))).toBeNull();
    expect(newPasswordError('x'.repeat(129))).toBe('passwordPattern');
  });
  it('register needs all three fields and no field error', () => {
    expect(canRegister('aziz_1', 'a@b.c', 'secret1')).toBe(true);
    expect(canRegister('', 'a@b.c', 'secret1')).toBe(false);
    expect(canRegister('aziz_1', '', 'secret1')).toBe(false);
    expect(canRegister('aziz_1', 'a@b.c', '')).toBe(false);
    expect(canRegister('az', 'a@b.c', 'secret1')).toBe(false);
    expect(canRegister('aziz_1', 'a@b.c', 'short')).toBe(false);
  });
  it('strength meter (a hint, never a block)', () => {
    expect(passwordStrength('')).toBeNull();
    expect(passwordStrength('abcdef')).toBe('weak');
    expect(passwordStrength('abc123')).toBe('okay');
    expect(passwordStrength('Abcdef123456')).toBe('strong');
    expect(passwordStrength('abcdefghijkl1')).toBe('okay');
  });
  it('reset: too short / mismatch, as ResetPasswordForm shows them', () => {
    expect(resetErrors('', '')).toEqual({ tooShort: false, mismatch: false });
    expect(resetErrors('123', '')).toEqual({ tooShort: true, mismatch: false });
    expect(resetErrors('123456', '12345')).toEqual({ tooShort: false, mismatch: true });
    expect(canReset('123456', '123456')).toBe(true);
    expect(canReset('123456', '')).toBe(false);
    expect(canReset('12345', '12345')).toBe(false);
  });
  it('the code is 6 digits; the resend cooldown is the mobile app\'s 60 s', () => {
    expect(CODE_LENGTH).toBe(6);
    expect(RESEND_COOLDOWN_S).toBe(60);
  });
});

describe('request bodies — exactly what the web forms send, built only from checked values', () => {
  it('login { email, password } as typed', () => {
    expect(loginBody('Me@Example.com', ' pass ')).toEqual({ email: 'Me@Example.com', password: ' pass ' });
    expect(JSON.stringify(loginBody('a@b.c', 'p'))).toBe('{"email":"a@b.c","password":"p"}');
  });
  it('login refuses non-strings, empty and absurd values', () => {
    for (const [e, p] of [[1, 'p'], ['a@b.c', null], ['', 'p'], ['a@b.c', ''], ['x'.repeat(255), 'p'], ['a@b.c', 'x'.repeat(1025)], [{}, []]] as const) {
      expect(loginBody(e, p)).toBeNull();
    }
  });
  it('register { username, email, password } (the user name trimmed, like the web input)', () => {
    expect(JSON.stringify(registerBody(' aziz_1 ', 'a@b.c', 'secret1'))).toBe('{"username":"aziz_1","email":"a@b.c","password":"secret1"}');
    expect(registerBody('az', 'a@b.c', 'secret1')).toBeNull();
    expect(registerBody('aziz_1', 'a@b.c', '12345')).toBeNull();
    expect(registerBody('aziz_1', 'a@b.c', 'x'.repeat(129))).toBeNull();
    expect(registerBody('aziz_1', '', 'secret1')).toBeNull();
    expect(registerBody(5, 'a@b.c', 'secret1')).toBeNull();
  });
  it('confirm { email, code } with a 6-digit code only', () => {
    expect(JSON.stringify(confirmBody('a@b.c', '012345'))).toBe('{"email":"a@b.c","code":"012345"}');
    for (const bad of ['12345', '1234567', '12345a', ' 12345', 123456, null]) expect(confirmBody('a@b.c', bad)).toBeNull();
    expect(confirmBody('', '123456')).toBeNull();
  });
  it('forgot { email }', () => {
    expect(forgotBody('a@b.c')).toEqual({ email: 'a@b.c' });
    expect(forgotBody('')).toBeNull();
    expect(forgotBody(42)).toBeNull();
  });
  it('reset { token, newPassword } — the token is main\'s, the renderer only sends the two password fields', () => {
    const token = 'a'.repeat(64);
    expect(JSON.stringify(resetBody(token, 'secret1', 'secret1'))).toBe(`{"token":"${token}","newPassword":"secret1"}`);
    expect(resetBody(token, 'secret1', 'secret2')).toBeNull();
    expect(resetBody(token, '12345', '12345')).toBeNull();
    expect(resetBody(null, 'secret1', 'secret1')).toBeNull();
    expect(resetBody('short', 'secret1', 'secret1')).toBeNull();
    expect(resetBody('a;b=c'.repeat(5), 'secret1', 'secret1')).toBeNull();
  });
});

describe('answers -> what the screen shows (the web forms\' own error handling)', () => {
  it('login', () => {
    expect(classifyLogin({ status: 200, body: { success: true } })).toEqual({ ok: true });
    expect(classifyLogin({ status: 401, body: { success: false, message: 'Invalid email or password', errors: null } })).toEqual({ ok: false, kind: 'message', message: 'Invalid email or password' });
    expect(classifyLogin({ status: 422, body: { message: 'Validation failed', errors: ['"email" must be a valid email'] } })).toEqual({ ok: false, kind: 'message', message: '"email" must be a valid email' });
    expect(classifyLogin({ status: 403, body: { code: 'ACCOUNT_BLOCKED', reason: 'spam', message: 'spam' } })).toEqual({ ok: false, kind: 'blocked', reason: 'spam' });
    expect(classifyLogin({ status: 403, body: { code: 'ACCOUNT_BLOCKED' } })).toEqual({ ok: false, kind: 'blocked', reason: null });
    expect(classifyLogin({ status: 401, body: {} })).toEqual({ ok: false, kind: 'wrongCredentials' });
    expect(classifyLogin({ status: 429, body: { message: 'Account locked for 15 minutes due to too many failed attempts' } })).toEqual({ ok: false, kind: 'message', message: 'Account locked for 15 minutes due to too many failed attempts' });
    expect(classifyLogin({ status: 502, body: null })).toEqual({ ok: false, kind: 'genericError' });
    expect(classifyLogin({ status: 0, body: null })).toEqual({ ok: false, kind: 'genericError' });
  });
  it('a server message is cut to 300 characters and an empty one is ignored', () => {
    const r = classifyLogin({ status: 400, body: { message: 'x'.repeat(5000) } });
    expect(r.ok === false && r.kind === 'message' && r.message.length).toBe(300);
    expect(classifyLogin({ status: 400, body: { message: '   ', errors: [''] } })).toEqual({ ok: false, kind: 'wrongCredentials' });
    expect(classifyLogin({ status: 400, body: { message: 42 } })).toEqual({ ok: false, kind: 'wrongCredentials' });
  });
  it('register (and resend)', () => {
    expect(classifyRegister({ status: 200, body: {} })).toEqual({ ok: true });
    expect(classifyRegister({ status: 409, body: { message: 'Email already registered' } })).toEqual({ ok: false, kind: 'message', message: 'Email already registered' });
    expect(classifyRegister({ status: 422, body: { message: 'Validation failed', errors: ['Username must be 3-20 chars'] } })).toEqual({ ok: false, kind: 'message', message: 'Username must be 3-20 chars' });
    expect(classifyRegister({ status: 500, body: {} })).toEqual({ ok: false, kind: 'genericError' });
    expect(classifyRegister({ status: 0, body: null })).toEqual({ ok: false, kind: 'genericError' });
  });
  it('confirm: message only (the web ignores errors[] there)', () => {
    expect(classifyConfirm({ status: 200, body: {} })).toEqual({ ok: true });
    expect(classifyConfirm({ status: 400, body: { message: 'Invalid verification code', errors: ['x'] } })).toEqual({ ok: false, kind: 'message', message: 'Invalid verification code' });
    expect(classifyConfirm({ status: 400, body: {} })).toEqual({ ok: false, kind: 'genericError' });
    expect(classifyConfirm({ status: 0, body: null })).toEqual({ ok: false, kind: 'genericError' });
  });
  it('forgot: 2xx -> sent (never says whether the address exists); 429 has its own text', () => {
    expect(classifyForgot({ status: 200, body: null })).toEqual({ ok: true });
    expect(classifyForgot({ status: 429, body: {} })).toEqual({ ok: false, kind: 'forgotRateLimited' });
    expect(classifyForgot({ status: 422, body: { message: 'Validation failed' } })).toEqual({ ok: false, kind: 'resetFailed' });
    expect(classifyForgot({ status: 0, body: null })).toEqual({ ok: false, kind: 'resetNetworkError' });
  });
  it('reset', () => {
    expect(classifyReset({ status: 200, body: {} })).toEqual({ ok: true });
    expect(classifyReset({ status: 400, body: { message: 'Invalid or expired password reset token' } })).toEqual({ ok: false, kind: 'message', message: 'Invalid or expired password reset token' });
    expect(classifyReset({ status: 400, body: {} })).toEqual({ ok: false, kind: 'resetFailed' });
    expect(classifyReset({ status: 502, body: null })).toEqual({ ok: false, kind: 'resetNetworkError' });
    expect(classifyReset({ status: 0, body: null })).toEqual({ ok: false, kind: 'resetNetworkError' });
  });
});

describe('nativeAuthTarget — the web sign-in pages are replaced by the native screen', () => {
  const O = 'https://app.wewatch.uz';
  it.each([
    ['/login', 'login'], ['/login/', 'login'], ['/uz/login', 'login'], ['/ru/login?x=1', 'login'], ['/register', 'register'], ['/register/', 'register'],
    ['/auth/forgot-password', 'forgot'], ['/auth/reset-password', 'reset'], ['/auth/callback?code=1', 'login'], ['/auth/close', 'login'], ['/en/auth/forgot-password', 'forgot'],
  ])('%s -> %s', (p, screen) => {
    expect(nativeAuthTarget(`${O}${p}`, APP)?.screen).toBe(screen);
  });
  it.each(['/guest?redirect=%2Froom%2Fa', '/home', '/room/abc', '/loginx', '/registered', '/authx', '/', '/support', '/api/auth/login'])('%s stays a web page', (p) => {
    expect(nativeAuthTarget(`${O}${p}`, APP)).toBeNull();
  });
  it('another origin or garbage is never a sign-in page', () => {
    expect(nativeAuthTarget('https://evil.example/login', APP)).toBeNull();
    expect(nativeAuthTarget('http://app.wewatch.uz/login', APP)).toBeNull();
    expect(nativeAuthTarget('not a url', APP)).toBeNull();
  });
  it('keeps a same-origin ?redirect= and drops anything that could leave the app', () => {
    expect(nativeAuthTarget(`${O}/login?redirect=%2Froom%2Fabc%3Fcode%3DX1`, APP)?.redirect).toBe('/room/abc?code=X1');
    for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '']) {
      expect(nativeAuthTarget(`${O}/login?redirect=${encodeURIComponent(bad)}`, APP)?.redirect).toBeNull();
    }
  });
  it('the reset token is taken only from the reset page, and only when it looks like one', () => {
    const t = 'f'.repeat(64);
    expect(nativeAuthTarget(`${O}/auth/reset-password?token=${t}`, APP)?.token).toBe(t);
    expect(nativeAuthTarget(`${O}/auth/reset-password?token=a%3Bb`, APP)?.token).toBeNull();
    expect(nativeAuthTarget(`${O}/auth/reset-password`, APP)?.token).toBeNull();
    expect(nativeAuthTarget(`${O}/login?token=${t}`, APP)?.token).toBeNull();
  });
  it('safeRedirectPath', () => {
    expect(safeRedirectPath('/home')).toBe('/home');
    for (const bad of [null, 1, '', 'home', '//x', '/\\x', '/a\nb', '/a\\b', '/'.padEnd(600, 'a')]) expect(safeRedirectPath(bad)).toBeNull();
  });
});
