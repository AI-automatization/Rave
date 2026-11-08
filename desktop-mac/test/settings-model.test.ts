import { describe, expect, it } from 'vitest';
import {
  AVATAR_MAX_BYTES, avatarImageUrl, checkAvatar, classifyError, detectImage, parseProfile, validatePasswordChange, validateProfile, settingsApiUrls,
} from '../src/main/settings-model';

const APP = 'https://app.wewatch.uz';
const bytes = (...b: number[]): Uint8Array => Uint8Array.from(b);
const pad = (head: number[], n = 64): Uint8Array => Uint8Array.from([...head, ...new Array(Math.max(0, n - head.length)).fill(0)]);

// Limits copied from the backend (services/user validator: username 3-20 [A-Za-z0-9_], bio <= 200) and the web app.
describe('validateProfile — username and bio (same rules as the server)', () => {
  it('accepts normal names', () => {
    for (const u of ['abc', 'Aziz_01', '_a_', 'A'.repeat(20)]) expect(validateProfile({ username: u, bio: '' }), u).toBeNull();
  });
  it('refuses a wrong username', () => {
    for (const u of ['', 'ab', 'A'.repeat(21), 'a b', 'a-b', 'é', 'аз1', 'a@b']) expect(validateProfile({ username: u, bio: '' }), u).toBe('username');
  });
  it('bio: up to 200 characters, empty is fine', () => {
    expect(validateProfile({ username: 'abc', bio: 'x'.repeat(200) })).toBeNull();
    expect(validateProfile({ username: 'abc', bio: 'x'.repeat(201) })).toBe('bio');
  });
});

describe('validatePasswordChange — same checks as the web page, plus the server maximum', () => {
  const ok = { current: 'old-pass', next: 'new-pass', confirm: 'new-pass' };
  it('accepts a good change', () => expect(validatePasswordChange(ok)).toBeNull());
  it('the current password is required', () => expect(validatePasswordChange({ ...ok, current: '' })).toBe('required'));
  it('the new password has at least 6 characters', () => expect(validatePasswordChange({ ...ok, next: '12345', confirm: '12345' })).toBe('min'));
  it('and at most 128', () => expect(validatePasswordChange({ ...ok, next: 'x'.repeat(129), confirm: 'x'.repeat(129) })).toBe('max'));
  it('both new passwords must match', () => expect(validatePasswordChange({ ...ok, confirm: 'other-one' })).toBe('mismatch'));
  it('a non-string is refused', () => expect(validatePasswordChange({ current: 1 as unknown as string, next: 'abcdef', confirm: 'abcdef' })).toBe('required'));
});

describe('avatar file — JPEG, PNG or WebP, at most 5 MB (checked by the file\'s own bytes, not its name)', () => {
  it('recognises the three formats', () => {
    expect(detectImage(pad([0xff, 0xd8, 0xff, 0xe0]))).toEqual({ mime: 'image/jpeg', ext: '.jpg' });
    expect(detectImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toEqual({ mime: 'image/png', ext: '.png' });
    expect(detectImage(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0, 0]))).toEqual({ mime: 'image/webp', ext: '.webp' });
  });
  it('refuses everything else (GIF, text, RIFF that is not WebP, too short)', () => {
    expect(detectImage(pad([0x47, 0x49, 0x46, 0x38]))).toBeNull();
    expect(detectImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImage(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]))).toBeNull(); // WAVE
    expect(detectImage(bytes(0xff, 0xd8))).toBeNull();
    expect(detectImage(new Uint8Array(0))).toBeNull();
  });
  it('checkAvatar: ok / type / size', () => {
    expect(checkAvatar(pad([0xff, 0xd8, 0xff], 1000))).toBe('ok');
    expect(checkAvatar(pad([0x47, 0x49, 0x46], 1000))).toBe('type');
    const big = pad([0xff, 0xd8, 0xff], AVATAR_MAX_BYTES + 1);
    expect(checkAvatar(big)).toBe('size');
    expect(checkAvatar(pad([0xff, 0xd8, 0xff], AVATAR_MAX_BYTES))).toBe('ok');
  });
});

describe('parseProfile — GET /api/user/me', () => {
  const wrap = (data: unknown) => ({ success: true, data });
  it('reads username, bio and avatar', () => {
    expect(parseProfile(wrap({ username: 'aziz', bio: 'hi', avatar: '/uploads/avatars/a.png', email: 'x@y.z' }))).toEqual({ username: 'aziz', bio: 'hi', avatar: '/uploads/avatars/a.png' });
  });
  it('also reads the { data: { user } } shape', () => {
    expect(parseProfile(wrap({ user: { username: 'aziz' } }))).toEqual({ username: 'aziz', bio: '', avatar: null });
  });
  it('missing bio / avatar are empty; a wrong shape is null', () => {
    expect(parseProfile(wrap({ username: 'aziz', bio: null, avatar: '' }))).toEqual({ username: 'aziz', bio: '', avatar: null });
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile(wrap({}))).toBeNull();
    expect(parseProfile(wrap({ username: 5 }))).toBeNull();
  });
  it('very long text is cut to what the server accepts', () => {
    const p = parseProfile(wrap({ username: 'a'.repeat(100), bio: 'b'.repeat(500) }));
    expect(p?.username.length).toBeLessThanOrEqual(20);
    expect(p?.bio.length).toBeLessThanOrEqual(200);
  });
});

describe('avatarImageUrl — only our own uploads path, on the app origin', () => {
  it('builds an absolute URL for /uploads/avatars/...', () => {
    expect(avatarImageUrl('/uploads/avatars/1-ab.png', APP)).toBe('https://app.wewatch.uz/uploads/avatars/1-ab.png');
  });
  it('refuses anything else (other hosts, other paths, traversal, scripts)', () => {
    for (const v of ['https://evil.example/a.png', '//evil.example/a.png', '/etc/passwd', '/uploads/avatars/../../x', 'javascript:alert(1)', '', null, undefined]) {
      expect(avatarImageUrl(v, APP), String(v)).toBeNull();
    }
  });
});

describe('classifyError — what went wrong, from the status and the server message', () => {
  it('maps the server messages we know', () => {
    expect(classifyError(400, 'Username already taken')).toBe('taken');
    expect(classifyError(400, 'Username contains prohibited content')).toBe('banned');
    expect(classifyError(401, 'Current password is incorrect')).toBe('wrongPassword');
    expect(classifyError(401, 'Not authenticated')).toBe('unauthorized');
    expect(classifyError(401, undefined)).toBe('unauthorized');
    expect(classifyError(400, 'Validation error')).toBe('invalid');
  });
  it('everything else is generic', () => {
    expect(classifyError(500, 'boom')).toBe('generic');
    expect(classifyError(0, undefined)).toBe('generic');
  });
});

describe('settingsApiUrls — always on the app origin', () => {
  it('lists the BFF endpoints', () => {
    expect(settingsApiUrls(APP)).toEqual({
      profile: 'https://app.wewatch.uz/api/user/me',
      avatar: 'https://app.wewatch.uz/api/user/me/avatar',
      changePassword: 'https://app.wewatch.uz/api/auth/change-password',
      logoutAll: 'https://app.wewatch.uz/api/auth/logout-all',
      logout: 'https://app.wewatch.uz/api/auth/logout',
    });
  });
  it('ignores any path in the app URL', () => {
    expect(settingsApiUrls('http://127.0.0.1:8145/home').profile).toBe('http://127.0.0.1:8145/api/user/me');
  });
});
