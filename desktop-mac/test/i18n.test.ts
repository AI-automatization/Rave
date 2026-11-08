import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, parseLocale, stringsFor, type Locale } from '../src/main/i18n';
import { NAV_SECTIONS } from '../src/main/shell-model';

const flatten = (o: unknown, prefix = ''): Record<string, string> =>
  Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') acc[key] = v;
    else Object.assign(acc, flatten(v, key));
    return acc;
  }, {});

describe('locale — read from the web app\'s own language cookie', () => {
  it('uses the same cookie name and the same default as the web app (locale.store.ts)', () => {
    expect(LOCALE_COOKIE).toBe('wewatch-locale');
    expect(DEFAULT_LOCALE).toBe('ru');
    expect([...LOCALES]).toEqual(['uz', 'ru', 'en']);
  });
  it.each(['uz', 'ru', 'en'])('accepts %s', (v) => {
    expect(parseLocale(v)).toBe(v);
  });
  it.each([undefined, null, '', ' uz', 'UZ', 'Uz', 'de', 'uz;ru', 'en-US', 42, {}, []])('anything else falls back to the default: %j', (v) => {
    expect(parseLocale(v)).toBe('ru');
  });
});

describe('strings', () => {
  const all = Object.fromEntries(LOCALES.map((l) => [l, flatten(stringsFor(l))])) as Record<Locale, Record<string, string>>;

  it('every language has exactly the same keys', () => {
    const keys = (l: Locale) => Object.keys(all[l]).sort();
    expect(keys('ru')).toEqual(keys('uz'));
    expect(keys('en')).toEqual(keys('uz'));
  });
  it('no string is empty', () => {
    for (const l of LOCALES) for (const [k, v] of Object.entries(all[l])) expect(v.trim(), `${l}.${k}`).not.toBe('');
  });
  it('the counters keep their {n} placeholder in every language', () => {
    for (const l of LOCALES) {
      expect(all[l]['home.viewers'], l).toContain('{n}');
      expect(all[l]['home.people'], l).toContain('{n}');
      expect(all[l]['home.weeklyViewers'], l).toContain('{n}');
    }
  });
  it('has one title per sidebar section and one label per sidebar item', () => {
    for (const l of LOCALES) {
      const s = stringsFor(l);
      expect(s.sections).toHaveLength(NAV_SECTIONS.length);
      for (const item of NAV_SECTIONS.flatMap((sec) => sec.items)) expect(s.nav[item.id], `${l}.${item.id}`).toBeTruthy();
    }
  });
  it('Uzbek is exactly the approved design (Stitch Variant 1): the sidebar did not change', () => {
    const s = stringsFor('uz');
    expect(s.sections).toEqual(NAV_SECTIONS.map((sec) => sec.title));
    for (const item of NAV_SECTIONS.flatMap((sec) => sec.items)) expect(s.nav[item.id]).toBe(item.label);
  });
  it('the three languages really differ (nothing was left in Uzbek)', () => {
    for (const key of ['nav.home', 'nav.friends', 'nav.settings', 'home.join', 'home.retry', 'home.errorTitle', 'home.sectionTitle', 'home.railTrending', 'home.railHistory', 'home.startError', 'ui.newRoom', 'ui.online', 'home.sortViewers', 'home.owner']) {
      expect(new Set(LOCALES.map((l) => all[l][key])).size, key).toBe(3);
    }
  });
});

// Reuse, not reinvention: wherever the web app already has the string, ours must be identical to it (all languages).
const MESSAGES = path.resolve(__dirname, '..', '..', 'apps', 'app-web', 'messages');
describe.skipIf(!fs.existsSync(path.join(MESSAGES, 'uz.json')))('strings that the web app already translates', () => {
  const web = (l: Locale) => JSON.parse(fs.readFileSync(path.join(MESSAGES, `${l}.json`), 'utf8')) as { nav: Record<string, string>; home: Record<string, string>; party: Record<string, string> };
  it.each(LOCALES)('%s matches apps/app-web/messages', (l) => {
    const w = web(l);
    const s = stringsFor(l);
    expect(s.nav.home).toBe(w.nav.home);
    expect(s.nav.friends).toBe(w.nav.friends);
    expect(s.nav.settings).toBe(w.nav.settings);
    expect(s.nav.rooms).toBe(w.home.allRooms);
    expect(s.ui.search).toBe(w.nav.search);
    expect(s.home.join).toBe(w.home.join);
    expect(s.home.retry).toBe(w.home.retry);
    expect(s.home.emptyTitle).toBe(w.home.empty);
    expect(s.home.emptyDesc).toBe(w.home.emptyDesc);
    expect(s.home.errorTitle).toBe(w.home.errorTitle);
    expect(s.home.errorDesc).toBe(w.home.errorDesc);
    expect(s.home.untitled).toBe(w.home.untitledRoom);
    // the web titles start with an emoji; the native rails do not
    const bare = (v: string): string => v.replace(/^\p{Extended_Pictographic}\s*/u, '');
    expect(s.home.railTrending).toBe(bare(w.home.weeklyTop));
    expect(s.home.railHistory).toBe(bare(w.home.watchHistory));
    expect(s.home.weeklyViewers).toBe(w.home.weeklyViewers.replace('{count}', '{n}'));
    expect(s.home.startError).toBe(w.home.watchStartError);
    expect(s.home.owner).toBe(w.party.memberOwner);
  });
});
