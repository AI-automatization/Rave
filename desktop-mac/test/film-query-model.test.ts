import { describe, expect, it } from 'vitest';
import { cleanFilmTitle, describeFilm, filmQueries } from '../src/main/film-query-model';

// Real page titles from uzmovi.net / asilmedia.org (2026-11-11).
const TOY = "O'yinchoqlar tarixi 5 Uzbek o'zbek tilida premyera multfilm Onlayn ko'rish";
const WWZ = "Olamlar jangi Z Jahon Urushi Z Premyera Uzbek O'zbek tilida Onlayn ko'rish";
const TODD = 'Suini Todd, Flit-stritlik iblis sartarosh / jinoyatchi premyera kino uzbek o‘zbek tilida onlayn ko‘rish';
const SERIAL = 'Quruqlik va dengiz urushi 2025 premyera serial barcha qismlari uzbek ozbek tilida onlayn korish';
const ASIL = 'Oqsoch xizmatkor ayol 2025 uzbek tilida ozbekcha tarjima kino Full HD tas-ix skachat';

describe('cleanFilmTitle', () => {
  it.each([
    [TOY, "O'yinchoqlar tarixi 5"],
    [WWZ, 'Olamlar jangi Z Jahon Urushi Z'],
    [TODD, 'Suini Todd, Flit-stritlik iblis sartarosh / jinoyatchi'],
    [SERIAL, 'Quruqlik va dengiz urushi'],
    [ASIL, 'Oqsoch xizmatkor ayol'],
    ['  Avatar 2 (2022) HD 1080p | Uzmovi  ', 'Avatar 2'],
  ])('%s → %s', (raw, want) => {
    expect(cleanFilmTitle(raw)).toBe(want);
  });
  it('keeps a title that is only junk words empty-safe', () => {
    expect(cleanFilmTitle("Uzbek o'zbek tilida onlayn ko'rish")).toBe('');
    expect(cleanFilmTitle(undefined as unknown as string)).toBe('');
  });
});

describe('filmQueries', () => {
  it('gives the clean title first, then its parts', () => {
    expect(filmQueries(TODD)).toEqual(['Suini Todd, Flit-stritlik iblis sartarosh / jinoyatchi', 'Suini Todd', 'Flit-stritlik iblis sartarosh']);
  });
  it('a plain title is one query', () => {
    expect(filmQueries(TOY)).toEqual(["O'yinchoqlar tarixi 5"]);
  });
  it('a long name without separators also gets its first three words (search boxes choke on long names)', () => {
    expect(filmQueries(WWZ)).toEqual(['Olamlar jangi Z Jahon Urushi Z', 'Olamlar jangi Z']);
  });
  it('at most three, no duplicates, no 1-letter queries', () => {
    const q = filmQueries('A / B / Matrix / Matrix / Neo, Trinity');
    expect(q.length).toBeLessThanOrEqual(3);
    expect(new Set(q).size).toBe(q.length);
    expect(q.every((x) => x.length >= 2)).toBe(true);
  });
  it('nothing usable → no queries', () => {
    expect(filmQueries("Uzbek o'zbek tilida onlayn ko'rish")).toEqual([]);
  });
});

describe('describeFilm', () => {
  it('a film', () => {
    expect(describeFilm(WWZ, 'https://uzmovi.net/tarjima-kinolarri/1073-olamlar-jangi-z.html')).toEqual({
      title: 'Olamlar jangi Z Jahon Urushi Z', queries: ['Olamlar jangi Z Jahon Urushi Z', 'Olamlar jangi Z'], kind: 'film', year: null, episode: null,
    });
  });
  it('a series by its title, with the year', () => {
    const d = describeFilm(SERIAL, 'https://uzmovi.net/tarjima-kinolarri/9145-quruqlik.html');
    expect(d.kind).toBe('series');
    expect(d.year).toBe(2025);
  });
  it('a series by its URL (episode page) and its episode number from the title', () => {
    const d = describeFilm('Smurflar 37-qism uzbek tilida', 'https://uzmovi.net/oilaviy/9134-smurflar/episode/37471/1.html');
    expect(d.kind).toBe('series');
    expect(d.episode).toBe(37);
    expect(d.title).toBe('Smurflar');
  });
  it.each(['Sherlok 2-mavsum 5-qism', 'Сериал Ход королевы 3 серия', 'Lost Season 1 Episode 4'])('series words: %s', (t) => {
    expect(describeFilm(t, 'https://example.com/x.html').kind).toBe('series');
  });
});
