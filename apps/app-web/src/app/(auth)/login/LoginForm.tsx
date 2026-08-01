'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle, ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';

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
  const [showPw, setShowPw] = useState(false);
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
            const data = err.data as { message?: string; code?: string; reason?: string };
            if (data.code === 'ACCOUNT_BLOCKED') {
              setBanInfo({ reason: data.reason ?? null });
              setError('');
            } else {
              setBanInfo(null);
              setError(data.message ?? t('wrongCredentials'));
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
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(123,114,248,0.12)' }}
        >
          <Loader2 size={32} className="animate-spin" style={{ color: '#7B72F8' }} />
        </div>
        <div className="text-center">
          <p className="text-[16px] font-semibold text-white">{t('loggingIn')}</p>
          <p className="text-[13px] text-white/35 mt-1">{t('loggingInSub')}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-[17px] font-semibold text-white text-center">{t('loginTitle')}</h1>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('emailLabel')}</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="email@example.com"
            required
            autoFocus
            autoComplete="email"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">{t('passwordLabel')}</label>
          {/* /auth/reset-password consumes an emailed token — linking straight to it meant this
              link could only ever render "invalid link" (prod audit 2026-08-01). The request form
              is the correct destination. */}
          <Link href="/auth/forgot-password" onClick={() => trackClick('login:forgot_password')} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            autoComplete="current-password"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Account banned */}
      {banInfo && (
        <div className="flex flex-col gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-2.5 text-red-400">
            <ShieldX size={16} className="shrink-0" />
            <span className="text-sm font-semibold">{t('bannedTitle')}</span>
          </div>
          {banInfo.reason && (
            <p className="text-xs text-red-300/80 pl-[26px]">{t('bannedReason', { reason: banInfo.reason })}</p>
          )}
          <p className="text-xs text-slate-500 pl-[26px]">{t('bannedHint')}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !email || !password}
        className="w-full h-10 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />{t('login')}...</>
          : t('login')}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-xs text-slate-500">{t('orDivider')}</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isPending}
        className="w-full h-10 rounded-md text-sm font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      {/* Telegram */}
      <button
        type="button"
        onClick={handleTelegramLogin}
        disabled={isPending}
        className="w-full h-10 rounded-md text-sm font-medium text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="#26A5E4"/>
          <path d="M5.5 11.8 17 7.4c.53-.19 1 .13.83.94l-2 9.42c-.14.63-.51.78-1.03.49l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.3-4.79c.23-.2-.05-.32-.36-.11l-6.55 4.12-2.83-.88c-.61-.19-.62-.61.13-.9z" fill="#fff"/>
        </svg>
        Telegram
      </button>

      {/* Register link */}
      <p className="text-sm text-center text-slate-400">
        {t('noAccount')}{' '}
        <Link href="/register" onClick={() => trackClick('login:go_to_register')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          {t('registerLink')}
        </Link>
      </p>
    </form>
  );
}
