import { NextResponse } from 'next/server';

// Returns runtime config values to client-side code.
// Avoids NEXT_PUBLIC_* vars that require a rebuild to change.
export async function GET() {
  // Use Railway-injected hostname (same pattern as service-urls.ts)
  const railwayHost = process.env.RAILWAY_SERVICE_WATCH_PART_URL;
  const explicit = process.env.WATCH_PARTY_SOCKET_URL ?? process.env.SOCKET_URL;
  const socketUrl = railwayHost ? `https://${railwayHost}` : (explicit ?? 'http://localhost:3004');

  return NextResponse.json({ data: { socketUrl } });
}
