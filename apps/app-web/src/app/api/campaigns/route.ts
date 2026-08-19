import { NextResponse } from 'next/server';
import { NOTIFICATION_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(NOTIFICATION_SERVICE_URL, '/api/v1');

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${baseUrl()}/notifications/campaigns`, { next: { revalidate: 60 } });
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
