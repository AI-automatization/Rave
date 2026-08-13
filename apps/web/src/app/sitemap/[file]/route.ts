import { SITEMAP_FILES, isSitemapFile, sitemapEntriesFor } from '@/lib/seo/sitemap-entries';

/**
 * One `<urlset>` per file of the index: `/sitemap/ru.xml`, `/sitemap/uz.xml`,
 * `/sitemap/en.xml`, `/sitemap/shared.xml`. hreflang alternates stay on every URL — a
 * locale split must not cost the language signals, which is the whole point of having them.
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

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

export function generateStaticParams(): { file: string }[] {
  return SITEMAP_FILES.map((file) => ({ file: `${file}.xml` }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await context.params;
  const name = file.endsWith('.xml') ? file.slice(0, -4) : file;

  if (!isSitemapFile(name)) {
    return new Response('Not Found', { status: 404 });
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...sitemapEntriesFor(name).map(({ url, lastModified, changeFrequency, priority, languages }) => {
      const alternates = Object.entries(languages ?? {}).map(
        ([hreflang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
      );

      return [
        '  <url>',
        `    <loc>${escapeXml(url)}</loc>`,
        ...alternates,
        // Date only: the registry stores calendar dates, and the previous
        // `2026-07-28T00:00:00.000Z` claimed a midnight precision we never had.
        `    <lastmod>${lastModified.slice(0, 10)}</lastmod>`,
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
