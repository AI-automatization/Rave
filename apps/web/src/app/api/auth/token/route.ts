import { NextRequest, NextResponse } from 'next/server';

// Returns the JWT access token in the response body.
// Used by socket.io client for auth (cookies can't be sent to WS).
export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ data: { token: accessToken } }, { status: 200 });
}
