'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { User, Mail, Lock, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { PATTERNS } from '@shared/constants';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';

interface Props {
  onVerify: (email: string) => void;
}

// 2026-08-02 UX pass, real research: "balance security with usability rather than overly
// complex password requirements" — a demanding rule checklist is exactly what drives signup
// abandonment. BUT the strength meter alone (length + variety, no hard block) turned out to
// let through passwords the backend actually rejects — PATTERNS.PASSWORD
// (services/auth/src/validators/auth.validator.ts) requires upper+lower+digit, not just 8+
// chars. A real user hit exactly this: typed an all-lowercase 8-char password, the meter never
// said anything was wrong, submit 422'd with a generic "Validation failed" this form didn't even
// surface (see error handling below). Importing the actual pattern so client and backend can
// never drift apart again, and using it as a real (if soft) block.
type Strength = 'weak' | 'okay' | 'strong';

function passwordStrength(pw: string): Strength | null {
  if (pw.length === 0) return null;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (pw.length >= 12 && variety >= 3) return 'strong';
  if (pw.length >= 8 && variety >= 2) return 'okay';
  return 'weak';
}

const STRENGTH_STYLE: Record<Strength, { bars: number; color: string; label: string }> = {
  weak:   { bars: 1, color: 'bg-red-500',     label: 'weak' },
  okay:   { bars: 2, color: 'bg-amber-500',   label: 'okay' },
  strong: { bars: 3, color: 'bg-emerald-500', label: 'strong' },
};

export function RegisterForm({ onVerify }: Props) {
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const tooShort = password.length > 0 && password.length < 8;
  // The real gate (matches backend PATTERNS.PASSWORD exactly) — length alone used to be the
  // only client-side check, which is why an all-lowercase 8-char password sailed through the UI
  // and only failed once it hit the server.
  const passwordInvalid = password.length > 0 && !PATTERNS.PASSWORD.test(password);
  const strength = passwordStrength(password);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort || passwordInvalid || !username || !email || !password) return;
    trackClick('register:submit');

    startTransition(() => {
      void (async () => {
        try {
          await authApi.register({ username, email, password });
          onVerify(email);
        } catch (err) {
          if (err instanceof ApiError) {
            // Backend sends the specific reason in `errors` (Joi messages, e.g. "Password must
            // be 8+ chars with uppercase, lowercase and number") — `message` alone is just the
            // generic "Validation failed", which is all this form used to show.
            const data = err.data as { message?: string; errors?: string[] | null };
            setError(data.errors?.[0] ?? data.message ?? t('genericError'));
          } else {
            setError(t('genericError'));
          }
        }
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] md:text-[30px] font-bold text-white leading-tight tracking-tight">{t('registerTitle')}</h1>
        <p className="text-[14px] text-white/45">{t('registerSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-slate-400">{t('usernameLabel')}</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              required
              autoFocus
              autoComplete="username"
              className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-slate-400">{t('emailLabel')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="email@example.com"
              required
              autoComplete="email"
              className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-slate-400">{t('passwordLabel')}</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="new-password"
              className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-11 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {tooShort && <p className="text-xs text-red-400">{t('passwordMin')}</p>}
          {!tooShort && passwordInvalid && <p className="text-xs text-red-400">{t('passwordPattern')}</p>}

          {/* Strength meter (2026-08-02 UX pass) — replaces the old "confirm password" field.
              The reveal toggle above already covers what confirm-password exists to catch (a typo
              you can't see) — a second full field for the same purpose is exactly the kind of
              non-essential friction the research on sign-up abandonment calls out. */}
          {strength && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < STRENGTH_STYLE[strength].bars ? STRENGTH_STYLE[strength].color : 'bg-white/[0.08]'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[11px] font-medium capitalize ${
                strength === 'weak' ? 'text-red-400' : strength === 'okay' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {STRENGTH_STYLE[strength].label}
              </span>
            </div>
          )}
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
          disabled={isPending || tooShort || passwordInvalid || !username || !email || !password}
          className="w-full h-12 rounded-xl text-[15px] font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(124,58,237,0.22)] hover:shadow-[0_0_24px_rgba(124,58,237,0.34)]"
        >
          {isPending
            ? <><Loader2 size={16} className="animate-spin" />{t('register')}...</>
            : t('register')}
        </button>

        {/* Login link */}
        <p className="text-[14px] text-center text-slate-400">
          {t('hasAccount')}{' '}
          <Link href="/login" onClick={() => trackClick('register:go_to_login')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </form>
  );
}
