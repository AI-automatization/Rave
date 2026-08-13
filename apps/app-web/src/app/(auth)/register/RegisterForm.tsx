'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { PATTERNS } from '@shared/constants';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { trackRegistrationStart, trackRegistrationComplete } from '@/lib/measurement-events';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';

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
  const locale = useLocale();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    trackRegistrationStart(locale);

    startTransition(() => {
      void (async () => {
        try {
          await authApi.register({ username, email, password });
          trackRegistrationComplete(locale);
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

  const disabled =
    isPending || tooShort || passwordInvalid || !username || !email || !password;

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="text-[25px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)] sm:text-[28px]">
          {t('registerHeading')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('registerSub')}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5" noValidate>
        <Field label={t('usernameLabel')}>
          <Input
            type="text"
            icon={User}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            required
            autoFocus
            autoComplete="username"
          />
        </Field>

        <Field label={t('emailLabel')}>
          <Input
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder={t('emailPlaceholder')}
            required
            autoComplete="email"
            inputMode="email"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <Field
            label={t('passwordLabel')}
            error={tooShort ? t('passwordMin') : passwordInvalid ? t('passwordPattern') : undefined}
          >
            <PasswordInput
              icon={Lock}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="new-password"
              toggleLabel={t('showPassword')}
            />
          </Field>

          {/* Strength meter (2026-08-02 UX pass) — replaces the old "confirm password" field.
              The reveal toggle already covers what confirm-password exists to catch (a typo
              you can't see) — a second full field for the same purpose is exactly the kind of
              non-essential friction the research on sign-up abandonment calls out. */}
          {strength && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < STRENGTH_STYLE[strength].bars ? STRENGTH_STYLE[strength].color : 'bg-[var(--ww-surface-2)]'
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

        {error && <Notice variant="danger">{error}</Notice>}

        <Button
          type="submit"
          variant="accent"
          size="xl"
          disabled={disabled}
          className="group mt-1 w-full font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t('register')}
            </>
          ) : (
            <>
              {t('register')}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-[var(--ww-text-3)]">
        {t('hasAccount')}{' '}
        <Link
          href="/login"
          onClick={() => trackClick('register:go_to_login')}
          className="-my-1.5 inline-block py-1.5 font-medium text-[var(--ww-accent-hi)] transition-colors hover:text-white"
        >
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
