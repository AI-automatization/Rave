'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Telegram redirects here after the user confirms the login_url button
// (services/auth telegramAuth.service.ts handleTelegramWebhook '/start login' case),
// appending signed auth data as query params (id/first_name/.../hash).
//
// On Android this page should rarely actually render — the same URL is registered as
// a verified App Link (apps/mobile/app.json intentFilters + this domain's
// /.well-known/assetlinks.json), so the OS hands the URL straight to the app before
// any page loads. This page exists for the cases where that interception doesn't
// happen (App Link not yet verified, app not installed, opened in a plain browser):
// it completes the web login itself and also tries the wewatch:// custom-scheme
// fallback so the app can pick it up if it's installed.
export default function TelegramCallbackPage() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const hash = params.get('hash');
    const id = params.get('id');
    if (!hash || !id) { setStatus('error'); return; }

    const payload = {
      id,
      first_name: params.get('first_name') ?? '',
      last_name: params.get('last_name') ?? undefined,
      username: params.get('username') ?? undefined,
      photo_url: params.get('photo_url') ?? undefined,
      auth_date: params.get('auth_date') ?? '',
      hash,
    };

    // Best-effort fallback for a device with the app installed but where the App Link
    // didn't intercept this navigation — re-offer the same data via the custom scheme.
    // Only when this ISN'T our own desktop-web popup flow (no window.opener): trying an
    // unregistered wewatch:// scheme pops a blocking "invalid address" native alert in
    // desktop Safari, which has nothing to do with a plain mobile-browser fallback.
    if (!window.opener) {
      window.location.href = `wewatch://auth/telegram/callback?${params.toString()}`;
    }

    fetch('/api/auth/telegram-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => setStatus(res.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [params]);

  // Web login popup (LoginForm.tsx handleTelegramLogin) also polls /api/auth/me on the
  // opener tab as a secondary path — but window.opener is NOT reliable here: Safari (and
  // some Chromium configs) sever window.opener once a popup navigates cross-origin (t.me)
  // and back, as a tracking-prevention measure. So this page can't depend on the opener
  // still existing to hand control back — it takes care of returning to the app itself:
  // try closing (works if this really is a popup with an intact opener), then unconditionally
  // fall through to navigating this same page to /home a moment later. If close() succeeded,
  // the window is already gone and this never runs; if it didn't (severed opener, popup
  // blocked entirely and this was actually the only tab, etc.), the user still ends up
  // logged in and on /home instead of stuck reading "Готово!" forever.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      if (window.opener) {
        try { window.close(); } catch { /* ignore */ }
      }
      window.location.href = '/home';
    }, 800);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0B18] text-white px-6">
      <div className="text-center">
        {status === 'pending' && <p className="text-slate-400">{t('tgPending')}</p>}
        {status === 'success' && <p className="text-emerald-400">{t('tgSuccess')}</p>}
        {status === 'error' && <p className="text-red-400">{t('tgError')}</p>}
      </div>
    </div>
  );
}
