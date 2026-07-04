import { NextResponse } from 'next/server';

const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL ??
  'https://notification-production-9c30.up.railway.app/api/v1';

export async function GET(): Promise<NextResponse> {
  try {
    // Fail fast (2.5s) so a slow/down backend never hangs the landing page
    const res = await fetch(`${NOTIFICATION_URL}/notifications/campaigns`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
