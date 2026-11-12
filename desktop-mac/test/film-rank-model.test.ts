import { describe, expect, it } from 'vitest';
import { describeFilm } from '../src/main/film-query-model';
import type { FilmHit } from '../src/main/film-sources-model';
import { nameMatches, rankHits } from '../src/main/film-rank-model';

const hit = (h: Partial<FilmHit> & Pick<FilmHit, 'source' | 'title' | 'url'>): FilmHit => ({
  altTitles: [], thumbnail: null, year: null, kind: 'film', paid: false, durationSec: null, ...h,
});

const BLOCKED = 'https://uzmovi.net/tarjima-kinolarri/1073-olamlar-jangi-z-jahon-urushi-z-premyera-uzbek-ozbek-tilida-onlayn-korish.html';
const WWZ = describeFilm("Olamlar jangi Z Jahon Urushi Z Premyera Uzbek O'zbek tilida Onlayn ko'rish", BLOCKED);

describe('nameMatches', () => {
  it('every word of a short query must be in the name', () => {
    expect(nameMatches(['Olamlar jangi Z'], 'Olamlar Jangi Z / Jahon Urushi Z / Dunyo Jangi Z')).toBe(true);
    expect(nameMatches(['Olamlar jangi Z'], 'Assasin: olamlar jangi 2021 premyera kino')).toBe(false);
    expect(nameMatches(['Olamlar jangi Z'], 'Titanlar jangi')).toBe(false);
  });
  it("ignores case, apostrophes and the sites' junk words", () => {
    expect(nameMatches(["O'yinchoqlar tarixi 5"], 'OYINCHOQLAR TARIXI 5 uzbek tilida HD')).toBe(true);
    expect(nameMatches(["O'yinchoqlar tarixi 5"], "O'yinchoqlar tarixi 4")).toBe(false);
  });
  it('any of the queries may match', () => {
    expect(nameMatches(['Suini Todd, Flit-stritlik iblis sartarosh', 'Suini Todd'], 'Suini Todd')).toBe(true);
  });
});

describe('rankHits', () => {
  const hits: FilmHit[] = [
    hit({ source: 'uzmovi', title: 'Olamlar jangi Z Jahon Urushi Z Premyera', url: BLOCKED }), // the blocked page itself
    hit({ source: 'asilmedia', title: 'Assasin: olamlar jangi 2021', url: 'https://asilmedia.org/12997-assasin.html' }),
    hit({ source: 'youtube', title: 'Olamlar jangi Z treyler', url: 'https://www.youtube.com/watch?v=t', durationSec: 140 }),
    hit({ source: 'rutube', title: 'Olamlar jangi Z (2013) to‘liq', url: 'https://rutube.ru/video/full/', durationSec: 6960 }),
    hit({ source: 'vk', title: 'Olamlar jangi Z parcha', url: 'https://vk.com/video1', durationSec: 300 }),
    hit({ source: 'vk', title: 'Olamlar jangi Z', url: 'https://vk.com/video2', durationSec: 1500 }), // too short for a film
    hit({ source: 'youtube', title: 'Olamlar jangi Z', url: 'https://www.youtube.com/watch?v=n', durationSec: null }), // unknown length
    hit({ source: 'cinerama', title: 'Война миров Z', altTitles: ['World War Z'], url: 'https://cinerama.uz/watch/17/49149', year: 2013, paid: true }),
    hit({ source: 'cinerama', title: 'Война миров', altTitles: ['War of the Worlds'], url: 'https://cinerama.uz/watch/3/50973', year: 2025, paid: true }),
    hit({ source: 'asilmedia', title: 'Olamlar Jangi Z / Jahon Urushi Z / Dunyo Jangi Z', url: 'https://asilmedia.org/13444-jahon-urushi-z.html', year: 2013 }),
  ];
  const ranked = rankHits(hits, WWZ, BLOCKED);
  const urls = ranked.map((r) => r.url);

  it('drops the blocked page, look-alike names, trailers, clips and too-short videos', () => {
    expect(urls).not.toContain(BLOCKED);
    expect(urls).not.toContain('https://asilmedia.org/12997-assasin.html');
    expect(urls).not.toContain('https://www.youtube.com/watch?v=t');
    expect(urls).not.toContain('https://vk.com/video1');
    expect(urls).not.toContain('https://vk.com/video2');
  });
  it("film sites first, then full-length videos, then unknown length, then cinerama's one guess", () => {
    expect(urls).toEqual([
      'https://asilmedia.org/13444-jahon-urushi-z.html',
      'https://rutube.ru/video/full/',
      'https://www.youtube.com/watch?v=n',
      'https://cinerama.uz/watch/17/49149',
    ]);
  });
  it('says why each one is there', () => {
    expect(ranked[0]).toMatchObject({ confidence: 'match' });
    expect(ranked.find((r) => r.source === 'cinerama')).toMatchObject({ confidence: 'maybe', paid: true });
    expect(ranked.find((r) => r.source === 'youtube')).toMatchObject({ lengthKnown: false });
  });
  it('a series accepts 30-minute episodes and puts the episode the owner was on first', () => {
    const info = describeFilm('Smurflar 37-qism uzbek tilida', 'https://uzmovi.net/oilaviy/9134-smurflar/episode/37471/1.html');
    const r = rankHits([
      hit({ source: 'youtube', title: 'Smurflar 12-qism', url: 'https://www.youtube.com/watch?v=12', durationSec: 1900, kind: 'series' }),
      hit({ source: 'youtube', title: 'Smurflar 37-qism', url: 'https://www.youtube.com/watch?v=37', durationSec: 1850, kind: 'series' }),
      hit({ source: 'youtube', title: 'Smurflar shorts', url: 'https://www.youtube.com/watch?v=s', durationSec: 50, kind: 'series' }),
    ], info, 'https://uzmovi.net/oilaviy/9134-smurflar/episode/37471/1.html');
    expect(r.map((x) => x.url)).toEqual(['https://www.youtube.com/watch?v=37', 'https://www.youtube.com/watch?v=12']);
  });
  it("a name known only from cinerama's guess (English) makes a hit 'maybe', listed after real matches", () => {
    const r = rankHits([
      hit({ source: 'rutube', title: 'World War Z (2013) full movie', url: 'https://rutube.ru/video/en/', durationSec: 6900 }),
      hit({ source: 'rutube', title: 'Olamlar jangi Z Jahon Urushi Z', url: 'https://rutube.ru/video/uz/', durationSec: 6900 }),
      hit({ source: 'rutube', title: 'World War II documentary', url: 'https://rutube.ru/video/doc/', durationSec: 6900 }),
    ], WWZ, BLOCKED, ['World War Z']);
    expect(r.map((x) => [x.url, x.confidence])).toEqual([
      ['https://rutube.ru/video/uz/', 'match'],
      ['https://rutube.ru/video/en/', 'maybe'],
    ]);
  });
  it("cinerama's guess is only for names we cannot compare (Cyrillic) — a Latin name that does not match is dropped", () => {
    const toy = describeFilm("O'yinchoqlar tarixi 5 Uzbek o'zbek tilida premyera multfilm Onlayn ko'rish", 'https://uzmovi.net/multfilmlari/8811-x.html');
    expect(rankHits([hit({ source: 'cinerama', title: 'Kasallik tarixi', url: 'https://cinerama.uz/watch/6/46370', paid: true })], toy, 'https://uzmovi.net/multfilmlari/8811-x.html')).toEqual([]);
    expect(rankHits([hit({ source: 'cinerama', title: 'История игрушек 5', altTitles: ['Toy Story 5'], url: 'https://cinerama.uz/watch/3/1', paid: true })], toy, 'https://uzmovi.net/multfilmlari/8811-x.html'))
      .toMatchObject([{ confidence: 'maybe' }]);
  });
  it('at most 12', () => {
    const many = Array.from({ length: 30 }, (_, i) => hit({ source: 'rutube', title: 'Olamlar jangi Z', url: `https://rutube.ru/video/${i}/`, durationSec: 7000 }));
    expect(rankHits(many, WWZ, BLOCKED)).toHaveLength(12);
  });
});
