'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    startTransition(() => {
      void (async () => {
        try {
          const res = await authApi.login({ email, password });
          setUser(res.data?.user ?? null);
          const redirect = searchParams.get('redirect') || '/home';
          router.push(redirect);
        } catch (err) {
          if (err instanceof ApiError) {
            const data = err.data as { message?: string };
            setError(data.message ?? t('wrongCredentials'));
          } else {
            setError(t('genericError'));
          }
        }
      })();
    });
  }

  async function handleGoogleLogin() {
    try {
      const res = await authApi.googleInit();
      const url = res.data?.url;
      const state = res.data?.state;
      if (!url || !state) { setError(t('genericError')); return; }

      const popup = window.open(url, 'google-auth', 'width=500,height=600');

      const finishLogin = async () => {
        try {
          const poll = await authApi.googlePoll(state!);
          if (poll.data?.user) {
            clearInterval(interval);
            window.removeEventListener('message', onMessage);
            try { popup?.close(); } catch { /* ignore */ }
            setUser(poll.data.user);
            router.push(searchParams.get('redirect') || '/home');
          }
        } catch { /* still pending */ }
      };

      const cleanup = () => {
        clearInterval(interval);
        window.removeEventListener('message', onMessage);
      };

      // Listen for postMessage from popup
      const onMessage = async (e: MessageEvent) => {
        if (e.data === 'google-auth-done') {
          await finishLogin();
        } else if (e.data === 'google-auth-error') {
          cleanup();
          try { popup?.close(); } catch { /* ignore */ }
          setError(t('genericError'));
        }
      };
      window.addEventListener('message', onMessage);

      // Also poll as fallback every 800ms
      const interval = setInterval(finishLogin, 800);

      // Cleanup after 2 min
      setTimeout(cleanup, 120_000);
    } catch {
      setError(t('genericError'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white text-center">{t('loginTitle')}</h1>

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
            className="w-full h-11 bg-[#13121F] border border-[#2A2840] rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">{t('passwordLabel')}</label>
          <Link href="/auth/reset-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
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
            className="w-full h-11 bg-[#13121F] border border-[#2A2840] rounded-xl pl-9 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
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
        className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />{t('login')}...</>
          : t('login')}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-[#2A2840]" />
        <span className="text-xs text-slate-500">or</span>
        <div className="flex-1 h-px bg-[#2A2840]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-11 rounded-xl text-sm font-medium text-white bg-[#13121F] border border-[#2A2840] hover:border-[#3A3860] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      {/* Register link */}
      <p className="text-sm text-center text-slate-400">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          {t('registerLink')}
        </Link>
      </p>
    </form>
  );
}
