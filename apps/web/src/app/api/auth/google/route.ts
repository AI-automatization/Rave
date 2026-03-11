import { NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

export function GET() {
  return NextResponse.redirect(`${AUTH_SERVICE}/google`);
}
