import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export const dynamic = 'force-dynamic';

// Full-page entry point for the classic (non-popup) Google login: the browser navigates HERE,
// which 302s straight to the auth service's passport-driven /google route, which redirects to
// Google, which redirects back to the auth service's own /google/callback, which finally 302s to
// /auth/callback?code=... on this app. No popup, no window.opener/postMessage, no polling — this
// replaces the popup+poll flow that kept breaking on mobile browsers (window.opener severed by
// Google's Cross-Origin-Opener-Policy, popup.closed unreliable — see T-S132/T-S134 history in
// LoginForm.tsx before this route existed).
//
// The real auth-service URL is a server-only env var — this route exists so the client only ever
// navigates to our own origin, never needs to know it.
export async function GET(req: NextRequest) {
  const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');
  const response = NextResponse.redirect(`${baseUrl}/google`);

  // Stashes the post-login destination across the OAuth round-trip (Google doesn't preserve our
  // query params) — /auth/callback's exchange call reads and clears this. Short TTL: the whole
  // round-trip normally takes seconds: a lingering cookie beyond that is just a stale redirect
  // target, not a security-sensitive value.
  const redirect = req.nextUrl.searchParams.get('redirect');
  if (redirect && redirect.startsWith('/')) {
    response.cookies.set('post_login_redirect', redirect, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 5 * 60,
    });
  }

  return response;
}
