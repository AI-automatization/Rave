import { FiltersEngine } from '@ghostery/adblocker';
import { describe, expect, it } from 'vitest';
import { engineBlocks, TYPE_MAP } from '../src/main/adblock-engine';

const eng = FiltersEngine.parse(['||adtec.ru^', '||traffaret.com^$third-party', '||ads.example.net/banner'].join('\n'));
const page = 'https://uzmovi.net/film.html';

describe('engineBlocks (filter-list matcher)', () => {
  it('cancels requests to hosts the list names, including subdomains', () => {
    expect(engineBlocks(eng, 'https://ads.adtec.ru/x.js', page, 'script')).toBe(true);
    expect(engineBlocks(eng, 'https://cdn.adtec.ru/pic.gif', page, 'image')).toBe(true);
    expect(engineBlocks(eng, 'https://cdn.traffaret.com/a.js', page, 'script')).toBe(true);
  });
  it('lets the page itself and unrelated hosts through', () => {
    expect(engineBlocks(eng, 'https://uzmovi.net/app.js', page, 'script')).toBe(false);
    expect(engineBlocks(eng, 'https://images.uzmovi.net/poster.jpg', page, 'image')).toBe(false);
    expect(engineBlocks(eng, 'https://rutube.ru/play/embed/1', page, 'subFrame')).toBe(false);
  });
  it('honours the rule options (third-party only)', () => {
    expect(engineBlocks(eng, 'https://traffaret.com/a.js', 'https://traffaret.com/', 'script')).toBe(false);
  });
  it('an unparsable url or an unknown type never throws or blocks', () => {
    expect(engineBlocks(eng, 'not a url', page, 'script')).toBe(false);
    expect(engineBlocks(eng, 'https://uzmovi.net/a', page, 'mystery')).toBe(false);
  });
  it('maps every Electron resource type the VB sees', () => {
    for (const t of ['mainFrame', 'subFrame', 'script', 'image', 'xhr', 'media', 'font', 'stylesheet', 'ping', 'other']) expect(TYPE_MAP[t]).toBeTruthy();
  });
});
