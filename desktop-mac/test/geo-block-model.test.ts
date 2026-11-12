import { describe, expect, it } from 'vitest';
import { GEO_PROBE_SCRIPT, isGeoBlocked } from '../src/main/geo-block-model';

// uzmovi's page, as the owner saw it on 2026-11-11 (Sweeney Todd, region block).
const UZMOVI_GEO = `MENYU
HUDUDIY CHEKLOV
Bu film hududingizda mavjud emas
Kontent tarqatish huquqlari sabab ushbu filmni joriy hududingizda namoyish eta olmaymiz.
VPN dasturi orqali kiring yoki boshqa mavjud filmlarni bemalol tomosha qilishingiz mumkin.
BOSH SAHIFAGA QAYTISH
KINO QIDIRISH`;

describe('isGeoBlocked', () => {
  it("recognises uzmovi's region-block page", () => {
    expect(isGeoBlocked(UZMOVI_GEO)).toBe(true);
  });
  it.each([
    'Это видео недоступно в вашем регионе',
    'Видео недоступно в вашей стране',
    'This video is not available in your country.',
    'Sorry, this content is not available in your region',
    "Bu video sizning mamlakatingizda mavjud emas",
    'Бу фильм ҳудудингизда мавжуд эмас',
  ])('recognises %s', (text) => {
    expect(isGeoBlocked(text)).toBe(true);
  });
  it.each([
    '', // empty page
    "Suini Todd, Flit-stritlik iblis sartarosh — premyera kino o'zbek tilida onlayn ko'rish. Izohlar mavjud emas.",
    'Bu qism hali mavjud emas — tez orada qo‘shiladi',
    'Region: Toshkent. Ushbu film 2007-yilda chiqqan.',
    'Available in HD in your browser',
  ])('does not flag an ordinary page: %s', (text) => {
    expect(isGeoBlocked(text)).toBe(false);
  });
  it('ignores non-strings safely', () => {
    expect(isGeoBlocked(undefined as unknown as string)).toBe(false);
    expect(isGeoBlocked(42 as unknown as string)).toBe(false);
  });
});

describe('GEO_PROBE_SCRIPT', () => {
  it('reads only a bounded slice of the visible text', () => {
    expect(GEO_PROBE_SCRIPT).toContain('innerText');
    expect(GEO_PROBE_SCRIPT).toMatch(/slice\(0, \d+\)/);
  });
});
