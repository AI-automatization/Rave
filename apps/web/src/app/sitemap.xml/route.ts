import { SITEMAP_FILES, lastModifiedOf, sitemapEntriesFor } from '@/lib/seo/sitemap-entries';

/**
 * `/sitemap.xml` is a **sitemap index**, not a urlset: it points at one file per locale
 * plus `shared` for the locale-less legal pages. The per-locale files live at
 * `/sitemap/<file>.xml`.
 *
 * Written by hand rather than through Next's `app/sitemap.ts` metadata convention because
 * that generator only ever emits a `<urlset>` — there is no code path in Next that serves
 * a `<sitemapindex>` (checked against the metadata route loader source, 2026-08-13), and
 * `generateSitemaps` produces the sub-files without an index above them.
 *
 * The address stays `/sitemap.xml`, which is what `robots.ts` advertises and what is
 * already submitted to Google Search Console and to both Yandex Webmaster hosts.
 */

export const dynamic = 'force-static';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export function GET(): Response {
  const files = SITEMAP_FILES.filter((file) => sitemapEntriesFor(file).length > 0);

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...files.map((file) =>
      [
        '  <sitemap>',
        `    <loc>${BASE}/sitemap/${file}.xml</loc>`,
        `    <lastmod>${lastModifiedOf(file)}</lastmod>`,
        '  </sitemap>',
      ].join('\n'),
    ),
    '</sitemapindex>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
