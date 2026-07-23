import { NextResponse, type NextRequest } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';
import { sitemapUrls } from '../../sitemap';

export const dynamic = 'force-dynamic';

const SECRET = process.env.INDEXNOW_SECRET ?? '';

/**
 * POST /api/indexnow
 *
 * Submits every indexable URL (or an explicit subset) to IndexNow. Call it after
 * a deploy that changed content:
 *   curl -X POST https://wewatch.uz/api/indexnow -H "x-indexnow-secret: $INDEXNOW_SECRET"
 *
 * Optional body: { "urls": ["https://wewatch.uz/faq"] } to submit only those.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!SECRET) {
    return NextResponse.json({ error: 'INDEXNOW_SECRET is not configured' }, { status: 503 });
  }
  if (req.headers.get('x-indexnow-secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let urls = sitemapUrls();
  try {
    const body = (await req.json()) as { urls?: unknown };
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urls = body.urls.filter((u): u is string => typeof u === 'string');
    }
  } catch {
    // No body — submit the full sitemap, which is the common case.
  }

  const result = await submitToIndexNow(urls);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
