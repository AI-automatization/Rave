'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { User, Mail, Lock, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';

interface Props {
  onVerify: (email: string) => void;
}

export function RegisterForm({ onVerify }: Props) {
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch || tooShort || !username || !email || !password) return;

    startTransition(() => {
      void (async () => {
        try {
          await authApi.register({ username, email, password });
          onVerify(email);
        } catch (err) {
          if (err instanceof ApiError) {
            const data = err.data as { message?: string };
            setError(data.message ?? t('genericError'));
          } else {
            setError(t('genericError'));
          }
        }
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-[17px] font-semibold text-white text-center">{t('registerTitle')}</h1>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('usernameLabel')}</label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            required
            autoFocus
            autoComplete="username"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

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
            autoComplete="email"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('passwordLabel')}</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            autoComplete="new-password"
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
        {tooShort && <p className="text-xs text-red-400">{t('passwordMin')}</p>}
      </div>

      {/* Confirm */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('confirmPasswordLabel')}</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            required
            autoComplete="new-password"
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-md pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
        {mismatch && <p className="text-xs text-red-400">{t('passwordMismatch')}</p>}
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
        disabled={isPending || mismatch || tooShort || !username || !email || !password || !confirm}
        className="w-full h-10 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
      >
        {isPending
          ? <><Loader2 size={15} className="animate-spin" />{t('register')}...</>
          : t('register')}
      </button>

      {/* Login link */}
      <p className="text-sm text-center text-slate-400">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          {t('loginLink')}
        </Link>
      </p>
    </form>
  );
}
