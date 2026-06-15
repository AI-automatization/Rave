import { NextResponse } from 'next/server';

// Returns runtime config values to client-side code.
// Avoids NEXT_PUBLIC_* vars that require a rebuild to change.
export async function GET() {
  // Use Railway-injected hostname (same pattern as service-urls.ts)
  const railwayHost = process.env.RAILWAY_SERVICE_WATCH_PART_URL;
  const explicit = process.env.WATCH_PARTY_SOCKET_URL ?? process.env.SOCKET_URL;
  const socketUrl = railwayHost ? `https://${railwayHost}` : (explicit ?? 'http://localhost:3004');

  // Debug: check total env count and some known keys
  const totalKeys = Object.keys(process.env).length;
  const hasNodeEnv = !!process.env.NODE_ENV;
  const hasPort = !!process.env.PORT;
  const hasWatchPartyServiceUrl = !!process.env.WATCH_PARTY_SERVICE_URL;

  return NextResponse.json({ data: { socketUrl, _debug: { totalKeys, hasNodeEnv, hasPort, hasWatchPartyServiceUrl } } });
}
