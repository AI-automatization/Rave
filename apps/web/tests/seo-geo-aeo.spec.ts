import { expect, test } from '@playwright/test';
import { GUIDES } from '../src/data/guides';
import { ARTICLES } from '../src/data/articles';
import { PRODUCT_FACTS } from '../src/data/product-facts';

type JsonLd = Record<string, unknown>;

const LOCALES = ['ru', 'uz', 'en'] as const;
const BASE = 'https://wewatch.uz';
const UNVERIFIED_PRODUCT_CLAIMS =
  /built-in browser|встроенн(?:ый|ого|ом) браузер|ichki brauzer|any video site|любой видеосайт|istalgan video-sayt|completely free|полностью бесплат|to['’]liq bepul/i;

function jsonLdObjects(html: string): JsonLd[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]) as JsonLd);
}

function schemaNodes(objects: JsonLd[]): JsonLd[] {
  return objects.flatMap((object) => {
    const graph = object['@graph'];
    return Array.isArray(graph) ? (graph as JsonLd[]) : [object];
  });
}

function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
}

function visibleHtmlText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:apos|#x27|#39);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test.describe('SEO / GEO / AEO regression checks', () => {
  test.beforeEach(async ({ page }) => {
    // SEO assertions do not depend on analytics. Blocking third-party scripts
    // keeps local/CI navigation deterministic when external hosts are slow.
    await page.route(/(?:googletagmanager\.com|mc\.yandex\.ru)/, (route) => route.abort());
  });

  test('sitemap contains unique final locale URLs and no double locale prefix', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');

    const xml = await response.text();
    const urls = sitemapUrls(xml);

    expect(urls.length).toBeGreaterThan(30);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((url) => /\/(?:ru|uz|en)\/(?:ru|uz|en)(?:\/|$)/.test(url))).toBe(false);

    for (const locale of LOCALES) {
      for (const path of ['features', 'pricing', 'products', 'company', 'contact', 'about']) {
        expect(urls).toContain(`${BASE}/${locale}/${path}`);
      }
    }
  });

  test('every guide owns one unique primary search intent per locale', () => {
    for (const locale of LOCALES) {
      const guides = GUIDES.filter((guide) => guide.locale === locale);
      const normalized = guides.map((guide) => guide.primaryIntent.trim().toLocaleLowerCase(locale));

      expect(normalized.every((intent) => intent.length >= 8), `${locale} guide intent is missing`).toBe(true);
      expect(new Set(normalized).size, `${locale} guide primary intents must be unique`).toBe(normalized.length);
    }
  });

  test('every sitemap URL returns indexable canonical HTML', async ({ request }) => {
    test.setTimeout(120_000);

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    const urls = sitemapUrls(await sitemapResponse.text());
    const titlesByLocale = new Map<string, string>();
    const headingsByLocale = new Map<string, string>();

    for (const absoluteUrl of urls) {
      const url = new URL(absoluteUrl);
      const response = await request.get(`${url.pathname}${url.search}`, { maxRedirects: 0 });
      expect(response.status(), `${url.pathname} must return HTTP 200`).toBe(200);
      expect(response.headers()['content-type'], `${url.pathname} must return HTML`).toContain('text/html');

      const html = await response.text();
      expect(html, `${url.pathname} rendered the Next.js error shell`).not.toContain('<html id="__next_error__"');
      expect(html, `${url.pathname} contains an unverified product claim`).not.toMatch(UNVERIFIED_PRODUCT_CLAIMS);
      expect(html, `${url.pathname} must not advertise an unpublished app store listing`).not.toMatch(
        /apps\.apple\.com|play\.google\.com/i,
      );
      expect(html, `${url.pathname} must not publish MobileApplication schema`).not.toMatch(
        /["']@type["']\s*:\s*["']MobileApplication["']/i,
      );
      expect(html, `${url.pathname} repeats the site name in its title`).not.toMatch(
        /<title>[^<]*\|\s*WeWatch\s*\|\s*WeWatch[^<]*<\/title>/i,
      );
      expect(html, `${url.pathname} must not be noindex`).not.toMatch(
        /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i,
      );
      expect(html, `${url.pathname} must have one H1`).toMatch(/<h1\b/i);
      expect((html.match(/<h1\b/gi) ?? []).length, `${url.pathname} must have exactly one H1`).toBe(1);

      const visibleText = visibleHtmlText(html);
      const nodes = schemaNodes(jsonLdObjects(html));
      for (const node of nodes) {
        if (node['@type'] === 'FAQPage') {
          for (const entity of (node.mainEntity ?? []) as Array<{ name: string; acceptedAnswer: { text: string } }>) {
            expect(visibleText, `${url.pathname} hides FAQ question from visible HTML`).toContain(entity.name);
            expect(visibleText, `${url.pathname} hides FAQ answer from visible HTML`).toContain(entity.acceptedAnswer.text);
          }
        }
        if (node['@type'] === 'HowTo') {
          for (const step of (node.step ?? []) as Array<{ name: string; text: string }>) {
            expect(visibleText, `${url.pathname} HowTo step name differs from visible HTML`).toContain(step.name);
            expect(visibleText, `${url.pathname} HowTo step text differs from visible HTML`).toContain(step.text);
          }
        }
      }

      const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
      expect(canonical, `${url.pathname} canonical is missing`).toBe(absoluteUrl);

      const locale = url.pathname.match(/^\/(ru|uz|en)(?:\/|$)/)?.[1] ?? 'en';
      expect(html, `${url.pathname} must be server-rendered with lang=${locale}`).toMatch(
        new RegExp(`<html[^>]+lang=["']${locale}["']`, 'i'),
      );

      const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.replace(/\s*\|\s*WeWatch\s*$/i, '').trim();
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      expect(title, `${url.pathname} title is missing`).toBeTruthy();
      expect(h1, `${url.pathname} H1 text is missing`).toBeTruthy();

      const titleKey = `${locale}:${title?.toLocaleLowerCase(locale)}`;
      const h1Key = `${locale}:${h1?.toLocaleLowerCase(locale)}`;
      expect(titlesByLocale.get(titleKey), `${url.pathname} competes with another URL using title "${title}"`).toBeUndefined();
      expect(headingsByLocale.get(h1Key), `${url.pathname} competes with another URL using H1 "${h1}"`).toBeUndefined();
      titlesByLocale.set(titleKey, url.pathname);
      headingsByLocale.set(h1Key, url.pathname);
    }
  });

  for (const locale of LOCALES) {
    test(`${locale} homepage has canonical and reciprocal hreflang`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${BASE}/${locale}`);

      for (const alternate of LOCALES) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${alternate}"]`)).toHaveAttribute(
          'href',
          `${BASE}/${alternate}`,
        );
      }
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        'href',
        `${BASE}/ru`,
      );
    });

    test(`${locale} homepage exposes FAQ in raw HTML and matching JSON-LD`, async ({ page, request }) => {
      const response = await request.get(`/${locale}`);
      expect(response.status()).toBe(200);
      const rawHtml = await response.text();
      expect(rawHtml).toContain('homepage-faq-answer-0');

      await page.goto(`/${locale}`);
      const questions = await page.locator('button[aria-controls^="homepage-faq-answer-"] > span:first-child').allTextContents();
      const answers = await page.locator('[id^="homepage-faq-answer-"] p').allTextContents();

      const faq = schemaNodes(jsonLdObjects(rawHtml)).find((node) => node['@type'] === 'FAQPage');
      expect(faq, 'FAQPage JSON-LD is missing').toBeTruthy();
      const entities = faq?.mainEntity as Array<{
        name: string;
        acceptedAnswer: { text: string };
      }>;

      expect(entities.map((entity) => entity.name)).toEqual(questions);
      expect(entities.map((entity) => entity.acceptedAnswer.text)).toEqual(answers);
    });

    test(`${locale} homepage publishes Web-only platform facts`, async ({ page, request }) => {
      const response = await request.get(`/${locale}`);
      const html = await response.text();
      const nodes = schemaNodes(jsonLdObjects(html));
      const applications = nodes.filter((node) =>
        ['SoftwareApplication', 'MobileApplication'].includes(String(node['@type'])),
      );

      expect(applications.length).toBeGreaterThan(0);
      for (const application of applications) {
        expect(application['@type']).toBe('SoftwareApplication');
        expect(application.operatingSystem).toBe('Web');
        expect(application).not.toHaveProperty('installUrl');
      }

      await page.goto(`/${locale}`);
      await expect(page.locator('body')).not.toContainText(/App Store|Google Play/i);
      await expect(page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]')).toHaveCount(0);
    });
  }

  test('raw HTML lang matches the locale URL', async ({ request }) => {
    for (const locale of LOCALES) {
      const response = await request.get(`/${locale}`);
      const html = await response.text();
      expect(html, `/${locale} must be server-rendered with lang=${locale}`).toMatch(
        new RegExp(`<html[^>]+lang=["']${locale}["']`, 'i'),
      );
    }
  });

  test('all editorial pages expose one matching Article, breadcrumb and visible byline', async ({ request }) => {
    test.setTimeout(120_000);

    for (const article of ARTICLES) {
      const response = await request.get(article.path);
      expect(response.status(), article.path).toBe(200);
      const html = await response.text();
      const nodes = schemaNodes(jsonLdObjects(html));
      const articleNodes = nodes.filter((node) => node['@type'] === 'Article');
      const breadcrumbs = nodes.filter((node) => node['@type'] === 'BreadcrumbList');
      const visibleText = visibleHtmlText(html);
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];

      expect(articleNodes, `${article.path} must have exactly one Article`).toHaveLength(1);
      expect(breadcrumbs, `${article.path} must have exactly one BreadcrumbList`).toHaveLength(1);
      expect(visibleHtmlText(h1 ?? ''), `${article.path} schema headline must equal H1`).toBe(article.headline);

      const schema = articleNodes[0];
      const canonical = `${BASE}${article.path}`;
      expect(schema.headline).toBe(article.headline);
      expect(schema.inLanguage).toBe(article.locale);
      expect(schema.datePublished).toBe(article.datePublished);
      expect(schema.dateModified).toBe(article.dateModified);
      expect(schema.url).toBe(canonical);
      expect(schema.image).toBe(`${BASE}/og-image`);
      expect(schema.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': canonical });
      expect(schema.author).toMatchObject({ '@type': 'Organization', name: 'WeWatch' });
      expect(schema.publisher).toMatchObject({ '@type': 'Organization', name: 'WeWatch' });

      expect(html).toContain('data-editorial-meta');
      expect(html).toContain(`data-date-published="true" dateTime="${article.datePublished}"`);
      if (article.dateModified !== article.datePublished) {
        expect(html).toContain(`data-date-modified="true" dateTime="${article.dateModified}"`);
      }
      expect(visibleText).toContain('WeWatch');

      const trail = breadcrumbs[0].itemListElement as Array<{ position: number; name: string; item: string }>;
      expect(trail.at(-1)).toEqual({
        '@type': 'ListItem',
        position: trail.length,
        name: article.headline,
        item: canonical,
      });
    }
  });

  test('synchronization facts are identical across RU, UZ and EN', async ({ request }) => {
    for (const locale of LOCALES) {
      const html = await (await request.get(`/${locale}/how-it-works`)).text();
      expect(html).toContain('data-synchronization-facts');
      expect(html).toContain(`data-correction-threshold-ms="${PRODUCT_FACTS.sync.correctionThresholdMs}"`);
      expect(html).toContain(`data-max-participants="${PRODUCT_FACTS.room.maxParticipants}"`);
      expect(html).toContain(`data-inactive-timeout-minutes="${PRODUCT_FACTS.room.inactiveTimeoutMinutes}"`);
      expect(html).toContain('data-sync-caveat');
    }
  });

  test('llms.txt publishes the same conservative product contract', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();

    expect(text).toContain('Platforms: Web (wewatch.uz) available; native iOS and Android apps in development');
    expect(text).toContain('Supported sources:** YouTube, VK Video, Rutube and direct .mp4 links');
    expect(text).toContain('core watch-party features are free');
    expect(text).toContain('Production checkout availability still requires owner confirmation');
    expect(text).not.toMatch(UNVERIFIED_PRODUCT_CLAIMS);
  });

  test('non-equivalent guide intents are not connected by hreflang', async ({ request }) => {
    const cases = [
      ['/ru/guides/watch-party-besplatno', '/en/guides/what-is-watch-party'],
      ['/en/guides/what-is-watch-party', '/ru/guides/watch-party-besplatno'],
      ['/ru/guides/smotret-serialy-vmeste-besplatno', '/uz/guides/serial-birgalikda'],
    ] as const;

    for (const [path, falseCounterpart] of cases) {
      const html = await (await request.get(path)).text();
      const alternateTags = html.match(/<link[^>]+rel=["']alternate["'][^>]*>/gi) ?? [];
      expect(alternateTags.join('\n'), `${path} must not claim ${falseCounterpart} as a translation`).not.toContain(
        falseCounterpart,
      );
    }
  });

  test('Uzbek guides hub has enough useful crawlable content', async ({ request }) => {
    const response = await request.get('/uz/guides');
    expect(response.status()).toBe(200);
    const html = await response.text();
    const visibleText = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z0-9#]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    expect(visibleText.length).toBeGreaterThanOrEqual(1000);
    expect(visibleText).toContain('Android va iOS ilovalari ishlab chiqilmoqda');
  });
});
