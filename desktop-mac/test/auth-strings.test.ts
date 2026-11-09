import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { authStringsFor, WEB_KEYS } from '../src/main/auth-strings';

const uz = authStringsFor('uz');
const ru = authStringsFor('ru');
const root = path.resolve(import.meta.dirname, '..');

describe('sign-in strings — uz and ru stay in step', () => {
  it('the same keys in both languages, none empty', () => {
    expect(Object.keys(uz).sort()).toEqual(Object.keys(ru).sort());
    for (const t of [uz, ru]) for (const [k, v] of Object.entries(t)) expect(v.trim(), k).not.toBe('');
  });
  it('language tags; English (the web app\'s third language) shows Russian', () => {
    expect(uz.lang).toBe('uz');
    expect(ru.lang).toBe('ru');
    expect(authStringsFor('en')).toBe(ru);
  });
  it('real translations: the sentences differ between the languages', () => {
    for (const k of ['welcomeBack', 'login', 'register', 'forgotHeading', 'resetHeading', 'emailVerifyTitle', 'help', 'backToSite', 'resend', 'orDivider'] as const) expect(uz[k]).not.toBe(ru[k]);
  });
  it('placeholders the screen fills in exist in both languages', () => {
    for (const t of [uz, ru]) {
      expect(t.bannedReason).toContain('{reason}');
      expect(t.forgotSentHint).toContain('{email}');
      expect(t.emailVerifyDigit).toContain('{n}');
    }
  });
  it('no Telegram sign-in anywhere in the Mac app', () => {
    for (const t of [uz, ru]) for (const v of Object.values(t)) expect(v.toLowerCase()).not.toContain('telegram');
  });
});

describe('the words are the web app\'s own (apps/app-web/messages, namespace "auth")', () => {
  const web = (l: string): Record<string, string> | null => {
    const f = path.join(root, '..', 'apps', 'app-web', 'messages', `${l}.json`);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as { auth: Record<string, string> }).auth : null;
  };
  it.each([['uz', uz], ['ru', ru]] as const)('%s: every web key is copied exactly', (l, t) => {
    const w = web(l);
    if (!w) return; // the web app is not next to this folder (e.g. a desktop-only checkout)
    for (const k of WEB_KEYS) expect(t[k], k).toBe(w[k]);
  });
});

describe('the renderer only asks for keys that exist', () => {
  it('every s(\'key\') in src/renderer/auth.ts is defined', () => {
    const src = fs.readFileSync(path.join(root, 'src', 'renderer', 'auth.ts'), 'utf8');
    const keys = new Set([...src.matchAll(/\bs\('([A-Za-z]+)'/g)].map((m) => m[1] as string));
    expect(keys.size).toBeGreaterThan(30);
    for (const k of keys) {
      expect(Object.hasOwn(uz, k), k).toBe(true);
      expect(Object.hasOwn(ru, k), k).toBe(true);
    }
    // keys reached through a variable: error kinds and strength levels
    for (const k of ['wrongCredentials', 'genericError', 'forgotRateLimited', 'resetFailed', 'resetNetworkError', 'errResend', 'weak', 'okay', 'strong', 'passwordMin', 'passwordPattern']) {
      expect(Object.hasOwn(uz, k), k).toBe(true);
    }
  });
});
