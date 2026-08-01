'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, MailCheck, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { trackClick } from '@/lib/analytics';

// Split out of page.tsx for the same reason as ResetPasswordForm: page.tsx is a server component
// and the locale is only known on the client, so translated markup has to render client-side.
export function ForgotPasswordHeader() {
  const t = useTranslations('auth');
  return (
    <>
      <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.12em] mb-2">
        {t('resetBadge')}
      </p>
      <h1 className="text-2xl font-extrabold text-white mb-2">{t('forgotHeading')}</h1>
      <p className="text-sm text-slate-400 leading-relaxed mb-7">
        {t('forgotSubtitle')}
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  // Deliberately shown whether or not the address is registered — the backend answers identically
  // in both cases (services/auth: "If this email exists, a reset link has been sent."), and saying
  // "no such user" here would turn this form into an account-enumeration oracle.
  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="w-14 h-14 text-emerald-400" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white">{t('forgotSent')}</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          {t('forgotSentHint', { email })}
        </p>
        <Link
          href="/login"
          onClick={() => trackClick('forgot_password:back_to_login')}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          {t('forgotBackToLogin')}
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    trackClick('forgot_password:submit');

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          if (res.ok) {
            setStatus('sent');
          } else {
            // 429 gets its own copy: the shared rate limiter fires after a handful of attempts and
            // the generic "failed" message would read as "wrong email", pushing the user to retry
            // and stay blocked.
            setErrorMsg(res.status === 429 ? t('forgotRateLimited') : t('resetFailed'));
            setStatus('error');
          }
        } catch {
          setErrorMsg(t('resetNetworkError'));
          setStatus('error');
        }
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-xs font-medium text-slate-400">
          {t('emailLabel')}
        </label>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
            placeholder="email@example.com"
            required
            autoFocus
            autoComplete="email"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !email}
        className="w-full mt-1 h-10 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />{t('forgotSending')}</>
          : t('forgotSubmit')}
      </button>

      <Link
        href="/login"
        onClick={() => trackClick('forgot_password:back_to_login')}
        className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={13} />
        {t('forgotBackToLogin')}
      </Link>
    </form>
  );
}
