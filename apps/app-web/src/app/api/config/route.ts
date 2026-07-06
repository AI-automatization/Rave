import { NextResponse } from 'next/server';

// NEXT_PUBLIC_SOCKET_URL is inlined at build time — this endpoint is kept for
// future runtime config but currently just reflects the baked-in value.
export async function GET() {
  return NextResponse.json({
    data: {
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3004',
    },
  });
}
