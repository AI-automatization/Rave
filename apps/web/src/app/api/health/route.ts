import { NextResponse } from 'next/server';

// Railway's healthcheck probe needs a path that answers 200. `/` cannot: proxy.ts
// redirects it to the visitor's locale with a 307, and a redirect is not a healthy
// response. That worked only for as long as Railway's prober followed redirects;
// when it stopped, every deploy failed with "service unavailable" while the app
// was up and listening. Hence a dedicated endpoint that returns 200 and nothing else.
//
// force-dynamic so it is never prerendered into a static asset — a cached 200 would
// report health long after the process stopped being able to produce one.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
