import { NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/telegram/init`, { method: 'POST', cache: 'no-store' });

    const data = await res.json() as { data?: { botUrl?: string }; success?: boolean };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Backend returns a native-app deep link (tg://resolve?domain=X&start=login) meant for
    // mobile; a plain browser can't handle the tg:// scheme, so extract the bot's domain and
    // rebuild it as a universal t.me link (opens Telegram Web, the desktop app, or the mobile
    // app — whichever the browser/OS can resolve).
    const botUrl = data.data?.botUrl;
    if (!botUrl) {
      return NextResponse.json({ message: 'No botUrl returned' }, { status: 500 });
    }

    const domain = new URL(botUrl).searchParams.get('domain');
    if (!domain) {
      return NextResponse.json({ message: 'Could not parse bot domain' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { url: `https://t.me/${domain}?start=login` } });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
