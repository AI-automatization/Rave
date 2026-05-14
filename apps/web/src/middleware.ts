import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Landing-only site — no auth redirects needed
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
