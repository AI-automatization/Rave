import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CARD_SITES, EXTRACT_CARDS_SCRIPT, cineramaSearchUrl, durationToSec, hitsFromBackend, parseCards, parseCinerama,
} from '../src/main/film-sources-model';

const cinerama = JSON.parse(readFileSync(new URL('./fixtures/cinerama-search.json', import.meta.url), 'utf8'));

describe('cinerama', () => {
  it('builds the search API URL', () => {
    expect(cineramaSearchUrl('Olamlar jangi Z')).toBe('https://api.cinerama.uz/v2/web/search?items=12&q=Olamlar%20jangi%20Z');
  });
  it('turns the API answer into hits with the English name, year, kind and paid flag', () => {
    const hits = parseCinerama(cinerama);
    expect(hits[0]).toEqual({
      source: 'cinerama', title: 'Война миров Z', altTitles: ['World War Z'], url: 'https://cinerama.uz/watch/17/49149',
      thumbnail: expect.stringMatching(/^https:\/\/files\.cinerama\.uz\//), year: 2013, kind: 'film', paid: true, durationSec: null,
    });
    expect(hits.find((h) => h.title.startsWith('Yuraklar jangi'))?.kind).toBe('series');
  });
  it('a wrong shape is no hits', () => {
    expect(parseCinerama(null)).toEqual([]);
    expect(parseCinerama({ data: { movies: [{ id: 'x' }] } })).toEqual([]);
  });
});

describe('card sites', () => {
  it('knows uzmovi and asilmedia search pages', () => {
    expect(CARD_SITES.map((s) => s.id)).toEqual(['uzmovi', 'asilmedia']);
    expect(CARD_SITES[0]!.searchUrl('Suini Todd')).toBe('https://uzmovi.net/search?q=Suini%20Todd');
    expect(CARD_SITES[1]!.searchUrl('Olamlar jangi')).toBe('https://asilmedia.org/index.php?do=search&subaction=search&story=Olamlar%20jangi');
  });
  it('keeps only same-site film pages, de-duplicated, https', () => {
    const raw = [
      { url: 'https://asilmedia.org/13444-jahon-urushi-z-dunyo-jangi-z-ujas-kino-uzbek-tilida-2013-ozbek.html', title: 'Olamlar Jangi Z / Jahon Urushi Z / Dunyo Jangi Z', thumbnail: 'https://asilmedia.org/uploads/p.jpg' },
      { url: 'https://asilmedia.org/13444-jahon-urushi-z-dunyo-jangi-z-ujas-kino-uzbek-tilida-2013-ozbek.html', title: '+398 1080p 720p', thumbnail: null },
      { url: 'https://evil.example/123-x.html', title: 'Olamlar jangi Z', thumbnail: null },
      { url: 'javascript:alert(1)', title: 'x', thumbnail: null },
      { url: 'https://asilmedia.org/rules.html', title: 'Qoidalar', thumbnail: null },
      'garbage',
    ];
    const hits = parseCards(raw, CARD_SITES[1]!);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ source: 'asilmedia', title: 'Olamlar Jangi Z / Jahon Urushi Z / Dunyo Jangi Z', kind: 'film', paid: false, durationSec: null, year: 2013 });
  });
  it('marks series pages', () => {
    const hits = parseCards([{ url: 'https://uzmovi.net/tarjima-kinolarri/9145-quruqlik-va-dengiz-urushi-2025-premyera-serial-barcha-qismlari.html', title: 'Quruqlik va dengiz urushi serial barcha qismlari', thumbnail: null }], CARD_SITES[0]!);
    expect(hits[0]?.kind).toBe('series');
  });
  it('the page script reads links with titles and pictures, bounded', () => {
    expect(EXTRACT_CARDS_SCRIPT).toContain('querySelectorAll');
    expect(EXTRACT_CARDS_SCRIPT).toMatch(/slice\(0, \d+\)/);
  });
});

describe('backend results', () => {
  it('durationToSec', () => {
    expect(durationToSec('1:02:03')).toBe(3723);
    expect(durationToSec('4:05')).toBe(245);
    expect(durationToSec(null)).toBeNull();
    expect(durationToSec('x')).toBeNull();
  });
  it('maps the in-app search rows', () => {
    const hits = hitsFromBackend([
      { title: 'World War Z (2013) full movie', thumbnail: null, url: 'https://rutube.ru/video/abc/', platform: 'rutube', duration: '1:56:00' },
    ]);
    expect(hits[0]).toEqual({ source: 'rutube', title: 'World War Z (2013) full movie', altTitles: [], url: 'https://rutube.ru/video/abc/', thumbnail: null, year: 2013, kind: 'film', paid: false, durationSec: 6960 });
  });
});
