import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { GUIDES } from '../src/data/guides';
import { ARTICLES } from '../src/data/articles';
import { PRODUCT_FACTS } from '../src/data/product-facts';
import { pageContextFor } from '../src/lib/analytics/page-context';
import { classifyReferrer } from '../src/lib/analytics/referrer';

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

/**
 * `/sitemap.xml` is an index, so the page URLs live one level down. Walking it here keeps
 * every assertion below on *pages* rather than on sitemap files, and fails loudly if a
 * sub-sitemap listed in the index is missing — a split sitemap's characteristic failure.
 */
async function allPageUrls(request: APIRequestContext): Promise<string[]> {
  const index = await request.get('/sitemap.xml');
  expect(index.status()).toBe(200);
  expect(index.headers()['content-type']).toContain('xml');

  const indexXml = await index.text();
  expect(indexXml, 'sitemap.xml must be a sitemap index').toContain('<sitemapindex');

  const urls: string[] = [];
  for (const absoluteUrl of sitemapUrls(indexXml)) {
    const { pathname } = new URL(absoluteUrl);
    const child = await request.get(pathname);
    expect(child.status(), `${pathname} listed in the index must exist`).toBe(200);
    expect(child.headers()['content-type'], `${pathname} must be XML`).toContain('xml');

    const childXml = await child.text();
    expect(childXml, `${pathname} must be a urlset`).toContain('<urlset');
    urls.push(...sitemapUrls(childXml));
  }
  return urls;
}

/**
 * Every host the source loads a `<Script src>` from.
 *
 * Read from the files rather than from the rendered HTML on purpose: Next injects
 * `afterInteractive`/`lazyOnload` tags client-side, so they never appear as a
 * `<script src>` attribute in the server HTML a test can fetch — the very tags most
 * likely to be a third party are the ones invisible to an HTML assertion.
 */
function thirdPartyScriptHosts(dir: string): string[] {
  const hosts = new Set<string>();

  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;

      for (const [tag] of readFileSync(full, 'utf8').matchAll(/<Script\b[^>]*\/?>/g)) {
        const host = /\bsrc=\{?[`'"]https:\/\/([a-z0-9.-]+)/i.exec(tag)?.[1];
        if (host) hosts.add(host);
      }
    }
  };

  walk(dir);
  return [...hosts];
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
    const urls = await allPageUrls(request);

    expect(urls.length).toBeGreaterThan(30);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((url) => /\/(?:ru|uz|en)\/(?:ru|uz|en)(?:\/|$)/.test(url))).toBe(false);

    for (const locale of LOCALES) {
      for (const path of ['features', 'pricing', 'products', 'company', 'contact', 'about']) {
        expect(urls).toContain(`${BASE}/${locale}/${path}`);
      }
    }
  });

  // robots.ts now branches on the request Host, so the canonical host has a way to go
  // silently dark that it did not have before: one bad comparison there and the whole
  // site serves `Disallow: /`. Nothing else in this suite would notice — every other
  // assertion here still passes against a site no crawler is allowed to fetch.
  test('robots.txt keeps the canonical host crawlable and points at the sitemap', async ({ request }) => {
    // The Host header is the input under test, so it is set explicitly rather than
    // inherited from baseURL — the suite runs against localhost as often as prod, and
    // the answer is supposed to differ between the two.
    const response = await request.get('/robots.txt', {
      headers: { host: new URL(BASE).host },
    });
    expect(response.status()).toBe(200);

    const body = await response.text();
    const groups = body.split(/\n(?=User-Agent:)/i);
    const wildcard = groups.find((group) => /^User-Agent:\s*\*/i.test(group)) ?? '';

    expect(wildcard).toMatch(/^\s*Allow:\s*\/\s*$/m);
    expect(wildcard).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
    expect(body).toMatch(/^\s*Disallow:\s*\/api\/\s*$/m);
    expect(body).toContain(`Sitemap: ${BASE}/sitemap.xml`);

    for (const bot of ['Googlebot', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'YandexBot']) {
      expect(body).toMatch(new RegExp(`^\\s*User-Agent:\\s*${bot}\\s*$`, 'im'));
    }
  });

  test('robots.txt blocks a non-canonical host serving the same deployment', async ({ request }) => {
    const response = await request.get('/robots.txt', {
      headers: { host: 'web-production-c7ee3.up.railway.app' },
    });
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toMatch(/^\s*Disallow:\s*\/\s*$/m);
    expect(body).not.toMatch(/^\s*Allow:\s*\/\s*$/m);
    // A blocked host must not advertise the canonical sitemap either — that is an
    // invitation to crawl the duplicate copy of every URL it lists.
    expect(body).not.toContain('Sitemap:');
  });

  /**
   * A script the app loads but the policy forbids fails in the one place nobody
   * watches: the browser drops the request before it leaves the machine, so our logs
   * show nothing, the third party reports nothing, and the result is indistinguishable
   * from "no traffic yet".
   *
   * Measured on prod 2026-08-14 (T-Y204): Yandex Metrica was in the HTML and
   * `NEXT_PUBLIC_YM_ID` had reached the build, yet `mc.yandex.ru/metrika/tag.js` was
   * blocked by this header and every hit was lost — visible only in a browser's network
   * panel. Two separate fixes had already been shipped for "Metrica is dead" before the
   * real cause was found.
   *
   * The assertion is the invariant, not a list of hosts: whatever the source loads,
   * the policy must allow. A tag added later is covered without anyone remembering
   * this test exists.
   */
  test('every third-party script host in the source is allowed by script-src', async ({ request }) => {
    const hosts = thirdPartyScriptHosts(join(__dirname, '..', 'src'));
    expect(hosts.length, 'the source should load at least one third-party script').toBeGreaterThan(0);

    const response = await request.get('/ru');
    const csp = response.headers()['content-security-policy'] ?? '';
    const scriptSrc = csp
      .split(';')
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith('script-src'));
    expect(scriptSrc, 'responses must carry a CSP with a script-src directive').toBeTruthy();

    for (const host of hosts) {
      expect(
        scriptSrc,
        `<Script src="https://${host}/…"> is loaded by the app but script-src forbids it`,
      ).toContain(host);
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

  /**
   * A page is extended to own an extra query (T-Y202) instead of a new page being
   * added for it, because a near-duplicate page divides the weight rather than
   * adding a position. That only holds while the claim and the copy agree: a
   * `secondaryIntents` entry whose phrase appears nowhere on the page is a plan,
   * not an owned query, and the next guide is then free to target it too.
   */
  test('declared secondary intents are unique per locale and present in the page copy', async ({ request }) => {
    for (const locale of LOCALES) {
      const intents = GUIDES.filter((guide) => guide.locale === locale)
        .flatMap((guide) => [guide.primaryIntent, ...(guide.secondaryIntents ?? [])])
        .map((intent) => intent.trim().toLocaleLowerCase(locale));

      expect(new Set(intents).size, `${locale} intents must be unique across primary and secondary`).toBe(
        intents.length,
      );
    }

    for (const guide of GUIDES.filter((guide) => guide.secondaryIntents?.length)) {
      const response = await request.get(guide.path);
      expect(response.status(), guide.path).toBe(200);
      const visibleText = visibleHtmlText(await response.text()).toLocaleLowerCase(guide.locale);

      for (const intent of guide.secondaryIntents ?? []) {
        expect(visibleText, `${guide.path} claims "${intent}" but the phrase is not in its copy`).toContain(
          intent.toLocaleLowerCase(guide.locale),
        );
      }
    }
  });

  /**
   * The declaration above is an honour system on its own: it proves the owner says
   * the phrase, and nothing about the page next door quietly saying it louder. This
   * closes that half — no other guide in the same locale may put an owned query in a
   * heading.
   *
   * Headings, not any occurrence. The cluster is deliberately cross-linked with the
   * target query as anchor text, so «смотреть кино вместе» appears on two pages that
   * link *to* its owner — that reinforces the owner rather than competing with it.
   * A title/H1/H2 is the claim that costs a position; a link is what pays for it.
   */
  test('no other guide claims an owned query in its own headings', async ({ request }) => {
    test.setTimeout(120_000);

    const headingsByPath = new Map<string, string>();
    for (const guide of GUIDES) {
      const response = await request.get(guide.path);
      expect(response.status(), guide.path).toBe(200);
      const html = await response.text();
      const headings = [
        ...(html.match(/<title>[\s\S]*?<\/title>/gi) ?? []),
        ...(html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? []),
        ...(html.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi) ?? []),
      ]
        .map(visibleHtmlText)
        .join(' | ');
      headingsByPath.set(guide.path, headings.toLocaleLowerCase(guide.locale));
    }

    for (const owner of GUIDES) {
      const owned = [owner.primaryIntent, ...(owner.secondaryIntents ?? [])];

      for (const intent of owned) {
        const needle = intent.trim().toLocaleLowerCase(owner.locale);

        for (const other of GUIDES) {
          if (other.path === owner.path || other.locale !== owner.locale) continue;

          expect(
            headingsByPath.get(other.path),
            `${other.path} claims "${intent}" in a heading — that query is owned by ${owner.path}`,
          ).not.toContain(needle);
        }
      }
    }
  });

  test('every sitemap URL returns indexable canonical HTML', async ({ request }) => {
    test.setTimeout(120_000);

    const urls = await allPageUrls(request);
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
    // Owner decision 2026-08-10: no Pro price is published anywhere until it is settled,
    // so the contract now asserts the absence of a figure rather than a caveat next to one.
    expect(text).toContain('not yet purchasable');
    expect(text).not.toMatch(/29[\s,_]?000/);
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

/**
 * Measurement-plan events (docs/seo/measurement-plan.md §Event contract).
 *
 * These run inside the SEO gate rather than a suite of their own because that is
 * the only Playwright job the CI actually executes for apps/web (seo-quality.yml
 * runs `npm run test:seo`); a spec file added next to it would never be run.
 *
 * `window.gtag` is stubbed in every case. gtag.js is a third-party download, and a
 * test whose result depends on googletagmanager.com being reachable from a CI
 * runner reports network weather, not code.
 */
test.describe('Analytics — measurement plan events', () => {
  test('page context is derived from the URL, and translated slugs share one cluster', async () => {
    expect(pageContextFor('/ru/guides/smotret-youtube-vmeste')).toEqual({
      locale: 'ru',
      page_type: 'guide',
      content_slug: 'smotret-youtube-vmeste',
      source_cluster: 'youtube',
    });

    // The RU and UZ pages are one topic under two names — reporting them as two
    // clusters is what would make the RU/UZ comparison meaningless.
    expect(pageContextFor('/uz/guides/youtube-birgalikda').source_cluster).toBe('youtube');
    expect(pageContextFor('/en/guides/watch-youtube-together').source_cluster).toBe('youtube');

    expect(pageContextFor('/ru').page_type).toBe('home');
    expect(pageContextFor('/uz/faq').page_type).toBe('faq');
    expect(pageContextFor('/ru/use-cases/dalnie-otnosheniya').source_cluster).toBe('long_distance');
    expect(pageContextFor('/ru/guides/smotret-vmeste-onlayn/').content_slug).toBe('smotret-vmeste-onlayn');
  });

  test('AI assistants are their own referrer class, not search or referral', async () => {
    expect(classifyReferrer('https://www.perplexity.ai/search?q=x', 'wewatch.uz')).toBe('ai_assistant');
    expect(classifyReferrer('https://chatgpt.com/', 'wewatch.uz')).toBe('ai_assistant');
    // gemini.google.com is a google.com subdomain: order of checks decides this one.
    expect(classifyReferrer('https://gemini.google.com/app', 'wewatch.uz')).toBe('ai_assistant');

    expect(classifyReferrer('https://www.google.com/search?q=x', 'wewatch.uz')).toBe('organic_search');
    expect(classifyReferrer('https://yandex.ru/search/?text=x', 'wewatch.uz')).toBe('organic_search');
    expect(classifyReferrer('https://t.me/somechannel', 'wewatch.uz')).toBe('social');
    expect(classifyReferrer('https://example.com/blog', 'wewatch.uz')).toBe('referral');
    expect(classifyReferrer('', 'wewatch.uz')).toBe('direct');
    // wewatch.uz → app.wewatch.uz is one product on two hosts, not an acquisition.
    expect(classifyReferrer('https://wewatch.uz/ru', 'app.wewatch.uz')).toBe('internal');
  });

  /**
   * Reads the real `window.dataLayer` rather than a stubbed `window.gtag`.
   *
   * A stub does not survive here: the inline `gtag-init` in RootDocument.tsx runs
   * `function gtag(){dataLayer.push(arguments)}`, and that declaration overwrites
   * any `window.gtag` assigned before it — so a test that substitutes gtag ends up
   * watching a function nobody calls while the event lands in dataLayer. Asserting
   * on dataLayer also matches what GA4 actually receives.
   *
   * The gtag.js download is blocked on purpose: the inline initialiser defines
   * `dataLayer` and `gtag` on its own, so every assertion below holds without
   * googletagmanager.com being reachable from the runner.
   */
  async function collectDataLayer(page: import('@playwright/test').Page, eventName: string) {
    return page.waitForFunction((name) => {
      const layer = (window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? [];
      const found = [...layer].find((entry) => entry[0] === 'event' && entry[1] === name);
      return found ? { name: found[1] as string, params: found[2] as Record<string, string> } : null;
    }, eventName, { timeout: 20_000 });
  }

  test('organic_landing_view is delivered through the queue with the contract parameters', async ({ page }) => {
    await page.route('**/googletagmanager.com/**', (route) => route.abort());

    // gtag.js is loaded with lazyOnload, so at mount `window.gtag` does not exist:
    // this records that the event really did take the buffered path rather than a
    // direct call that happened to find gtag ready.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { __gtagAtDomReady: string }).__gtagAtDomReady = typeof (
          window as unknown as { gtag?: unknown }
        ).gtag;
      });
    });

    await page.goto('/ru/guides/smotret-youtube-vmeste', { referer: 'https://www.perplexity.ai/' });

    const handle = await collectDataLayer(page, 'organic_landing_view');
    const event = await handle.jsonValue();

    expect(await page.evaluate(() => (window as unknown as { __gtagAtDomReady: string }).__gtagAtDomReady)).toBe(
      'undefined',
    );
    expect(event?.params).toEqual({
      locale: 'ru',
      page_type: 'guide',
      content_slug: 'smotret-youtube-vmeste',
      referrer_class: 'ai_assistant',
    });
  });

  test('a same-site arrival is not counted as a new acquisition', async ({ page }, testInfo) => {
    await page.route('**/googletagmanager.com/**', (route) => route.abort());

    // Built from baseURL, not hardcoded: localhost and 127.0.0.1 are different
    // hosts to the classifier, and hardcoding one made this test assert the
    // opposite of what it claims to.
    const origin = new URL(testInfo.project.use.baseURL ?? 'http://localhost:3000').origin;
    await page.goto('/ru', { referer: `${origin}/ru/faq` });

    // Give the queue its full flush window before concluding nothing was sent.
    await page.waitForTimeout(3000);
    const events = await page.evaluate(() => {
      const layer = (window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? [];
      return [...layer].filter((entry) => entry[1] === 'organic_landing_view').length;
    });
    expect(events).toBe(0);
  });

  test('cta_click fires for links that leave for the app', async ({ page }) => {
    await page.route('**/googletagmanager.com/**', (route) => route.abort());
    await page.goto('/ru/how-it-works');

    const cta = page.locator('a[href*="/register"]').first();
    await cta.waitFor();
    // The CTA leaves the site; the click only needs to be observed, not followed.
    await cta.evaluate((node) => node.setAttribute('target', '_blank'));
    await cta.click();

    const handle = await collectDataLayer(page, 'cta_click');
    const event = await handle.jsonValue();

    expect(event?.params.destination).toBe('/register');
    expect(event?.params.locale).toBe('ru');
    expect(event?.params.page_type).toBe('how_it_works');
    expect(event?.params.cta_id).toContain('/register');
  });
});
