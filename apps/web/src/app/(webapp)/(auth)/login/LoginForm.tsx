'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Loader2, ShieldX, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';

interface BanInfo {
  reason: string | null;
}

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    trackClick('login:submit');

    startTransition(() => {
      void (async () => {
        try {
          const res = await authApi.login({ email, password });
          setUser(res.data?.user ?? null);
          const redirect = searchParams.get('redirect') || '/home';
          router.push(redirect);
        } catch (err) {
          if (err instanceof ApiError) {
            // Same fix as RegisterForm — `errors` (Joi's specific per-field messages) is more
            // useful than the generic `message` ("Validation failed") when present.
            const data = err.data as { message?: string; code?: string; reason?: string; errors?: string[] | null };
            if (data.code === 'ACCOUNT_BLOCKED') {
              setBanInfo({ reason: data.reason ?? null });
              setError('');
            } else {
              setBanInfo(null);
              setError(data.errors?.[0] ?? data.message ?? t('wrongCredentials'));
            }
          } else {
            setBanInfo(null);
            setError(t('genericError'));
          }
        }
      })();
    });
  }

  function killPopup(p: Window | null) {
    if (!p || p.closed) return;
    // Navigate popup to our origin first (cross-origin popup.close can be unreliable)
    try { p.location.href = `${window.location.origin}/auth/close`; } catch { /* ignore */ }
    // Also attempt direct close at intervals as fallback
    [200, 500, 1000].forEach((ms) =>
      setTimeout(() => { try { if (!p.closed) p.close(); } catch { /* ignore */ } }, ms),
    );
  }

  function handleGoogleLogin() {
    trackClick('login:google');
    setError('');
    setIsGoogleLoading(true);

    // Classic full-page redirect — no popup, no polling. Was popup+poll (window.open + postMessage
    // + /api/auth/me polling), which needed three rounds of patching for mobile-browser breakage
    // (T-S132, T-S134: Google's Cross-Origin-Opener-Policy severs window.opener once the popup
    // navigates cross-origin, making both `popup.closed` and postMessage unreliable). This route
    // 302s to the auth service's passport /google endpoint; Google redirects back to
    // /auth/callback on this same origin, which finishes the login. See
    // api/auth/google/start/route.ts for the full round-trip.
    const redirect = searchParams.get('redirect');
    window.location.href = redirect
      ? `/api/auth/google/start?redirect=${encodeURIComponent(redirect)}`
      : '/api/auth/google/start';
  }

  async function handleTelegramLogin() {
    trackClick('login:telegram');
    setError('');
    setIsTelegramLoading(true);

    // Open popup BEFORE any await so Chrome doesn't block it (user-gesture context).
    const w = 500, h = 600;
    const left = Math.round((window.screen.width - w) / 2);
    const top = Math.round((window.screen.height - h) / 2);
    const popup = window.open(
      'about:blank',
      'telegram-auth',
      `width=${w},height=${h},left=${left},top=${top}`,
    );

    try {
      const res = await authApi.telegramInit();
      const url = res.data?.url;
      if (!url) {
        popup?.close();
        setIsTelegramLoading(false);
        setError(t('genericError'));
        return;
      }

      if (popup) {
        popup.location.href = url;
      } else {
        // Popup was blocked entirely — fall back to same-tab redirect
        window.location.href = url;
        return;
      }

      let done = false;
      // No postMessage channel from the Telegram callback page (unlike Google's OAuth
      // callback) — its httpOnly cookies land on the same origin as this tab, so polling
      // /api/auth/me is enough to detect the moment login completes in the popup.
      const finishLogin = async () => {
        if (done) return;
        try {
          const me = await authApi.me();
          if (me.data?.user) {
            done = true;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
            killPopup(popup);
            setUser(me.data.user);
            // Full page reload — ensures freshly-set httpOnly cookies reach middleware
            window.location.href = searchParams.get('redirect') || '/home';
          }
        } catch { /* still pending */ }
      };

      const cleanup = (withError?: string) => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('focus', onVisible);
        setIsTelegramLoading(false);
        if (withError) setError(withError);
      };

      // popup.closed is not trustworthy while the popup sits on a cross-origin page (T-S132
      // follow-up — see the identical comment in handleGoogleLogin for the full COOP-severing
      // explanation). Only act on `.closed` once we get a genuine focus-return signal.
      const onVisible = () => {
        if (document.visibilityState !== 'visible' || done) return;
        void finishLogin();
        if (popup?.closed) {
          setTimeout(() => { if (!done) cleanup(); }, 1500);
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', onVisible);

      // Ground-truth poll every 2s — was 800ms, unnecessarily aggressive for a human OAuth flow.
      // /api/auth/me isn't behind pollRateLimiter, so this is just about load, not the 429 bug —
      // slowed to match the Google flow for consistency.
      const interval = setInterval(finishLogin, 2000);

      // Cleanup after 2 min
      setTimeout(() => cleanup(), 120_000);
    } catch {
      setIsTelegramLoading(false);
      setError(t('genericError'));
    }
  }

  // Full-screen loading while Google/Telegram OAuth completes in popup
  if (isGoogleLoading || isTelegramLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-10" aria-live="polite" aria-busy="true">
        <div className="relative flex h-16 w-16 items-center justify-center">
          {/* Ikki qatlam: turg'un halqa + aylanuvchi yoy. Bitta spinner
              qorong'i fonda "osilib qolgan" ko'rinadi. */}
          <span className="absolute inset-0 rounded-full border border-[var(--ww-line)]" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--ww-accent-hi)]" />
          <span className="h-9 w-9 rounded-full bg-[var(--ww-accent-soft)]" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-[var(--ww-text)]">{t('loggingIn')}</p>
          <p className="mt-1.5 text-[13px] text-[var(--ww-text-3)]">{t('loggingInSub')}</p>
        </div>
      </div>
    );
  }

  const canSubmit = Boolean(email && password) && !isPending;

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      {/* Sarlavha — eski 17px "Hisobingizga kiring" o'rniga haqiqiy
          tipografik lang'ar: sahifada ko'z birinchi shu yerga tushishi kerak. */}
      <header className="flex flex-col gap-2">
        <h1 className="text-[25px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)] sm:text-[28px]">
          {t('welcomeBack')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('welcomeBackSub')}</p>
      </header>

      {/* Social login leads (2026-08-02, UX pass) — every current sign-in-flow guide agrees on
          this ordering: one-tap OAuth first, email/password as the fallback underneath, not the
          other way around. Previously password was first and Google/Telegram were an
          afterthought below the fold-equivalent — backwards from how a majority of users
          actually want to authenticate.

          Tugmada faqat brend nomi — to'liq "Google orqali davom etish" matni bu yerga
          sig'maydi va Button'dagi `whitespace-nowrap` tufayli o'ralmay tashqariga chiqib
          ketardi (prod buzilishi, 2026-08-14): panel ichki kengligi 336px → ustun 162px,
          undan 66px ikonka+padding'ga ketadi, matnga 96px qoladi, "Продолжить с Telegram"
          esa ~150px. To'liq matn aria-label'da qoldi — skrinrider kontekstni yo'qotmaydi. */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="subtle"
          size="xl"
          onClick={handleGoogleLogin}
          disabled={isPending}
          aria-label={t('continueWithGoogle')}
          className="w-full"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>

        <Button
          type="button"
          variant="subtle"
          size="xl"
          onClick={handleTelegramLogin}
          disabled={isPending}
          aria-label={t('continueWithTelegram')}
          className="w-full"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#26A5E4"/>
            <path d="M5.5 11.8 17 7.4c.53-.19 1 .13.83.94l-2 9.42c-.14.63-.51.78-1.03.49l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.3-4.79c.23-.2-.05-.32-.36-.11l-6.55 4.12-2.83-.88c-.61-.19-.62-.61.13-.9z" fill="#fff"/>
          </svg>
          Telegram
        </Button>
      </div>

      {/* Ajratgich */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[var(--ww-line)]" />
        <span className="text-[12px] uppercase tracking-[0.14em] text-[var(--ww-text-4)]">
          {t('orDivider')}
        </span>
        <span className="h-px flex-1 bg-[var(--ww-line)]" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5" noValidate>
        <Field label={t('emailLabel')}>
          <Input
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder={t('emailPlaceholder')}
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
          />
        </Field>

        <Field
          label={t('passwordLabel')}
          action={
            /* /auth/reset-password consumes an emailed token — linking straight to it meant this
               link could only ever render "invalid link" (prod audit 2026-08-01). The request form
               is the correct destination. */
            <Link
              href="/auth/forgot-password"
              onClick={() => trackClick('login:forgot_password')}
              /* -my-1.5 py-1.5 — bosish balandligini 19px dan 31px ga
                 ko'taradi (WCAG 2.2 minimumi 24px), lekin manfiy margin
                 tufayli tartibda hech narsa siljimaydi */
              className="-my-1.5 inline-block py-1.5 text-[12.5px] font-medium text-[var(--ww-accent-hi)] transition-colors hover:text-white"
            >
              {t('forgotPassword')}
            </Link>
          }
        >
          <PasswordInput
            icon={Lock}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder={t('passwordPlaceholder')}
            required
            autoComplete="current-password"
            toggleLabel={t('showPassword')}
          />
        </Field>

        {banInfo && (
          <Notice variant="danger" icon={ShieldX} title={t('bannedTitle')}>
            {banInfo.reason && <p>{t('bannedReason', { reason: banInfo.reason })}</p>}
            <p className="mt-1 text-[var(--ww-text-3)]">{t('bannedHint')}</p>
          </Notice>
        )}

        {error && <Notice variant="danger">{error}</Notice>}

        <Button
          type="submit"
          variant="accent"
          size="xl"
          disabled={!canSubmit}
          className="group mt-1 w-full font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t('login')}
            </>
          ) : (
            <>
              {t('login')}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-[var(--ww-text-3)]">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          onClick={() => trackClick('login:go_to_register')}
          className="-my-1.5 inline-block py-1.5 font-medium text-[var(--ww-accent-hi)] transition-colors hover:text-white"
        >
          {t('registerLink')}
        </Link>
      </p>
    </div>
  );
}
