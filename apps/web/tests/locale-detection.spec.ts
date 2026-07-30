import { test, expect } from '@playwright/test';

/**
 * Til aniqlash — `/` da, faqat `Accept-Language` bo'yicha (T-S194).
 *
 * Bu testlar ikki narsani qo'riqlaydi:
 *   1. `/` odamni brauzer tiliga qarab to'g'ri joyga yuboradi;
 *   2. **boshqa hech bir URL burilmaydi** — ulashilgan havola hamma uchun bir xil
 *      sahifa bo'lib qolishi shart.
 *
 * Ikkinchisi muhimroq: 2026-07-28 gacha cookie mexanizmi aynan shuni buzgan edi,
 * va 2026-07-30 da prod'da `/` **har qanday til uchun** `/uz` qaytarayotgani
 * shu qadar uzoq sezilmay qolgan, chunki bu holat hech qachon testga tushmagan.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** `/` so'rovining Location sarlavhasi — redirect kuzatilmaydi. */
async function rootTarget(
  request: import('@playwright/test').APIRequestContext,
  headers: Record<string, string>,
): Promise<{ status: number; location: string | undefined; headers: Record<string, string> }> {
  const res = await request.get('/', { headers, maxRedirects: 0 });
  return { status: res.status(), location: res.headers()['location'], headers: res.headers() };
}

test.describe('Til aniqlash — odam', () => {
  // [izoh, Accept-Language, kutilgan manzil]
  const cases: Array<[string, string, string]> = [
    ['Rossiyadan — ruscha', 'ru-RU,ru;q=0.9,en;q=0.8', '/ru'],
    ['AQShdan — inglizcha', 'en-US,en;q=0.9', '/en'],
    ['Braziliyadan — pt yo’q, inglizchaga tushadi', 'pt-BR,pt;q=0.9', '/en'],
    ['O‘zbekistondan — o‘zbekcha', 'uz-UZ,uz;q=0.9,ru;q=0.8', '/uz'],
    ['Germaniyadan, ro‘yxatda en bor', 'de-DE,de;q=0.9,en;q=0.8', '/en'],
    ['Braziliyalik ru ham biladi — ru ustun', 'pt-BR,pt;q=0.9,ru;q=0.5', '/ru'],
    ['q-tartib hurmat qilinadi', 'ru;q=0.3,en;q=0.9', '/en'],
    ['* — hech qanday tanlov yo‘q', '*', '/ru'],
  ];

  for (const [name, acceptLanguage, expected] of cases) {
    test(`${name} → ${expected}`, async ({ request }) => {
      const { status, location } = await rootTarget(request, {
        'User-Agent': BROWSER_UA,
        'Accept-Language': acceptLanguage,
      });
      expect(status, '301 EMAS — brauzer doimiy redirectni abadiy keshlaydi').toBe(307);
      expect(location).toBe(expected);
    });
  }

  test('Accept-Language yo‘q — x-default (/ru)', async ({ request }) => {
    const { status, location } = await rootTarget(request, { 'User-Agent': BROWSER_UA });
    expect(status).toBe(307);
    expect(location).toBe('/ru');
  });
});

test.describe('Til aniqlash — botlar doim x-default oladi', () => {
  // Googlebot AQSh IP'idan keladi va `en` yuborishi mumkin — agar u `/en` ga
  // yuborilsa, ruscha sahifalar indeksdan chiqib ketishi mumkin edi.
  const bots: Array<[string, string]> = [
    ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['YandexBot', 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'],
    ['GPTBot', 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)'],
    ['ClaudeBot', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'],
    ['TelegramBot (havola ko‘rinishi)', 'TelegramBot (like TwitterBot)'],
  ];

  for (const [name, ua] of bots) {
    test(`${name} — en-US so‘rasa ham /ru`, async ({ request }) => {
      const { location } = await rootTarget(request, {
        'User-Agent': ua,
        'Accept-Language': 'en-US,en;q=0.9',
      });
      expect(location, `${name} x-default'dan boshqa joyga yuborildi`).toBe('/ru');
    });
  }

  test('User-Agent bo‘sh — /ru', async ({ request }) => {
    // Hech bir haqiqiy brauzer UA'siz kelmaydi, shuning uchun noma'lum mijoz
    // x-default oladi. Playwright UA'ni butunlay olib tashlay olmaydi (fixture
    // o'zinikini qo'yadi), shuning uchun bo'sh qiymat beriladi — kod uchun
    // ikkalasi ham bir xil: "kim ekani noma'lum".
    const { location } = await rootTarget(request, {
      'User-Agent': '',
      'Accept-Language': 'en-US',
    });
    expect(location).toBe('/ru');
  });
});

test.describe('Ulashilgan havola buzilmaydi', () => {
  const pages = [
    '/ru',
    '/uz',
    '/en',
    '/ru/faq',
    '/uz/faq',
    '/en/faq',
    '/uz/guides/kino-birgalikda',
    '/ru/guides/smotret-anime-vmeste',
  ];
  const languages = ['ru-RU', 'en-US', 'uz-UZ', 'pt-BR'];

  for (const path of pages) {
    test(`${path} — har qanday brauzer tilida o‘sha sahifa`, async ({ request }) => {
      for (const acceptLanguage of languages) {
        const res = await request.get(path, {
          headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': acceptLanguage },
          maxRedirects: 0,
        });
        expect(res.status(), `${path} (${acceptLanguage}) burildi — havola ulashib bo'lmaydi`).toBe(
          200,
        );
      }
    });
  }
});

test.describe('Holat saqlanmaydi va keshlanmaydi', () => {
  test('/ hech qanday cookie o‘rnatmaydi', async ({ request }) => {
    const { headers } = await rootTarget(request, {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'en-US',
    });
    expect(headers['set-cookie'], 'til tanlovi saqlanmasligi kerak').toBeUndefined();
  });

  test('/ javobi umumiy keshga tushmaydi', async ({ request }) => {
    const { headers } = await rootTarget(request, {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'en-US',
    });
    // Javob tashrif buyuruvchiga bog'liq — Railway edge yoki oraliq kesh uni
    // boshqa odamga bermasligi shart.
    expect(headers['cache-control']).toContain('no-store');
    expect(headers['vary']).toContain('Accept-Language');
  });
});

test.describe('Eski indekslangan manzillar joyida qoladi', () => {
  const moved: Array<[string, string]> = [
    ['/faq', '/ru/faq'],
    ['/how-it-works', '/ru/how-it-works'],
    ['/guides', '/ru/guides'],
    ['/guides/smotret-anime-vmeste', '/ru/guides/smotret-anime-vmeste'],
    ['/pricing', '/ru/pricing'],
  ];

  for (const [from, to] of moved) {
    test(`${from} → ${to} (doimiy)`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), 'reytingni o‘tkazish uchun doimiy bo‘lishi shart').toBe(308);
      expect(res.headers()['location']).toContain(to);
    });
  }
});
