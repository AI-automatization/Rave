import { describe, expect, it } from 'vitest';
import { HELP_CONTACT_IDS, HELP_CONTACTS, helpContactUrl, helpStringsFor } from '../src/main/help-strings';

const uz = helpStringsFor('uz');
const ru = helpStringsFor('ru');

describe('help strings — uz and ru stay in step', () => {
  it('same structure: same number of FAQ items and the same contact ids in the same order', () => {
    expect(uz.faq.length).toBe(ru.faq.length);
    expect(uz.faq.length).toBeGreaterThan(0);
    expect(uz.contacts.map((c) => c.id)).toEqual(ru.contacts.map((c) => c.id));
    expect(Object.keys(uz).sort()).toEqual(Object.keys(ru).sort());
  });
  it('no empty text anywhere, and the two languages never share a sentence', () => {
    for (const s of [uz, ru]) {
      for (const k of ['title', 'back', 'heading', 'subtitle', 'faqTitle', 'contactTitle', 'contactSub', 'open'] as const) expect(s[k].trim()).not.toBe('');
      for (const f of s.faq) {
        expect(f.q.trim()).not.toBe('');
        expect(f.a.trim()).not.toBe('');
      }
    }
    for (const k of ['title', 'back', 'heading', 'subtitle', 'faqTitle', 'contactTitle', 'contactSub', 'open'] as const) expect(uz[k]).not.toBe(ru[k]);
    uz.faq.forEach((f, i) => expect(f.a).not.toBe(ru.faq[i]?.a));
  });
  it('language tags, fallback: English follows the web app and shows Russian', () => {
    expect(uz.lang).toBe('uz');
    expect(ru.lang).toBe('ru');
    expect(helpStringsFor('en')).toBe(ru);
  });
  it('no contact row without a whitelist entry, and the handle matches the link', () => {
    for (const s of [uz, ru]) {
      expect(s.contacts.map((c) => c.id).sort()).toEqual([...HELP_CONTACT_IDS].sort());
      for (const c of s.contacts) expect(HELP_CONTACTS[c.id].toLowerCase()).toContain(c.handle.replace(/^@/, '').toLowerCase());
    }
  });
});

describe('helpContactUrl — the renderer sends an id, never a URL', () => {
  it('every known id maps to a fixed https or mailto URL', () => {
    for (const id of HELP_CONTACT_IDS) {
      const u = helpContactUrl(id);
      expect(u).not.toBeNull();
      expect(u).toMatch(/^(https:\/\/t\.me\/\w+|mailto:[\w.]+@[\w.]+)$/);
    }
    expect(helpContactUrl('telegram-support')).toBe('https://t.me/wewatch_support');
    expect(helpContactUrl('telegram-channel')).toBe('https://t.me/wewatchh');
    expect(helpContactUrl('email')).toBe('mailto:support@wewatch.uz');
  });
  it('anything else is refused', () => {
    for (const bad of [undefined, null, 5, {}, [], '', 'EMAIL', ' email', 'email ', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'https://evil.example', 'javascript:alert(1)', 'file:///etc/passwd', 'mailto:a@b.c']) {
      expect(helpContactUrl(bad)).toBeNull();
    }
  });
  it('the table holds no other scheme', () => {
    for (const u of Object.values(HELP_CONTACTS)) expect(/^(https:|mailto:)/.test(u)).toBe(true);
  });
});
