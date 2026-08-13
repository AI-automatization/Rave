import { sitemapEntries } from '@/lib/seo/sitemap-entries';

/**
 * The sitemap is written by hand instead of Next's `app/sitemap.ts` metadata file for one
 * reason: that generator serialises the XML itself and gives no way to emit a
 * `<?xml-stylesheet?>` processing instruction. Without it, Chrome renders our sitemap as an
 * unreadable wall of text — any XML document carrying nodes from a foreign namespace (ours
 * has `<xhtml:link>` on every URL, for hreflang) drops out of the browser's XML tree viewer.
 * The stylesheet turns the same bytes into a readable table for humans; crawlers ignore the
 * instruction entirely, so nothing about indexing changes.
 *
 * The URL stays `/sitemap.xml`, which is what robots.txt advertises and what is already
 * submitted to Google Search Console and both Yandex Webmaster hosts.
 */

export const dynamic = 'force-static';

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/**
 * Date only, not a full timestamp. The source values are calendar dates from the page
 * registry, and `new Date(date).toISOString()` used to dress them up as
 * `2026-07-28T00:00:00.000Z` — a midnight precision we never actually had.
 * `YYYY-MM-DD` is valid W3C Datetime, which is what the sitemap schema asks for.
 */
function lastmod(date: string): string {
  return date.slice(0, 10);
}

export function GET(): Response {
  const entries = sitemapEntries();

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(({ url, lastModified, changeFrequency, priority, languages }) => {
      const alternates = Object.entries(languages ?? {}).map(
        ([hreflang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
      );

      return [
        '  <url>',
        `    <loc>${escapeXml(url)}</loc>`,
        ...alternates,
        `    <lastmod>${lastmod(lastModified)}</lastmod>`,
        `    <changefreq>${changeFrequency}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n');
    }),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
