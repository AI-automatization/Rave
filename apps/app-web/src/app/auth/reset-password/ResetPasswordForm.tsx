'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { trackClick } from '@/lib/analytics';

interface Props {
  token: string | null;
}

// Lives here rather than in page.tsx because that page is a server component: the locale is only
// known on the client (cookie → locale.store → NextIntlClientProvider), so anything translated has
// to render client-side.
export function ResetPasswordHeader() {
  const t = useTranslations('auth');
  return (
    <>
      <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.12em] mb-2">
        {t('resetBadge')}
      </p>
      <h1 className="text-2xl font-extrabold text-white mb-2">{t('resetHeading')}</h1>
      <p className="text-sm text-slate-400 leading-relaxed mb-7">
        {t('resetSubtitle')}
      </p>
    </>
  );
}

export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="w-14 h-14 text-red-400" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white">{t('resetLinkInvalid')}</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          {t('resetLinkInvalidHint')}
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-400" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white">{t('resetSuccess')}</h2>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          {t('resetSuccessHint')}
        </p>
        <a
          href="wewatch://"
          onClick={() => trackClick('reset_password:open_app')}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          {t('resetOpenApp')}
        </a>
      </div>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort  = password.length > 0 && password.length < 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch || tooShort || !password) return;
    trackClick('reset_password:submit');

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword: password }),
          });
          if (res.ok) {
            setStatus('success');
          } else {
            const data = await res.json() as { message?: string };
            setErrorMsg(data.message ?? t('resetFailed'));
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
      {/* New password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('resetNewPasswordLabel')}</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setStatus('idle'); }}
            placeholder={t('passwordMin')}
            required
            autoFocus
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
        {tooShort && (
          <p className="text-xs text-red-400">{t('passwordMin')}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('resetRepeatLabel')}</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showCf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setStatus('idle'); }}
            placeholder={t('resetRepeatLabel')}
            required
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowCf((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showCf ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {mismatch && (
          <p className="text-xs text-red-400">{t('passwordMismatch')}</p>
        )}
      </div>

      {/* API error */}
      {status === 'error' && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || mismatch || tooShort || !password || !confirm}
        className="w-full mt-1 h-10 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />{t('resetSaving')}</>
          : t('resetSubmit')}
      </button>
    </form>
  );
}
