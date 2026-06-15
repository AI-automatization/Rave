import { NextResponse } from 'next/server';

// Returns runtime config values to client-side code.
// Avoids NEXT_PUBLIC_* vars that require a rebuild to change.
export async function GET() {
  return NextResponse.json({
    data: {
      socketUrl: process.env.SOCKET_URL ?? 'http://localhost:3004',
    },
  });
}
