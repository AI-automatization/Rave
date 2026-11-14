'use client';

/**
 * Ro'yxatdan o'tish formasi (2026-11-14, noldan qayta yozilgan). Tuzilma
 * mobil RegisterScreen bilan bir xil: sarlavha → username → email → parol
 * (+ kuch ko'rsatkichi) → Ro'yxatdan o'tish → "yoki" → Google.
 *
 * Ilgari bu sahifada Google tugmasi UMUMAN yo'q edi — Google bilan
 * ro'yxatdan o'tmoqchi bo'lgan foydalanuvchi login sahifasiga qaytishi kerak
 * edi. Google OAuth yangi foydalanuvchiga akkauntni avtomatik yaratadi, shuning
 * uchun bu yerda ham xuddi o'sha `SocialAuth` ishlatiladi.
 *
 * Parol qoidasi backend bilan bitta manbadan: `PATTERNS.PASSWORD` (shared).
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { PATTERNS } from '@shared/constants';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { trackRegistrationStart, trackRegistrationComplete } from '@/lib/measurement-events';
import { withRedirect } from '@/lib/safe-redirect';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SocialAuth, OrDivider } from '../SocialAuth';

interface Props {
  onVerify: (email: string) => void;
}

type Strength = 'weak' | 'okay' | 'strong';

const STRENGTH_STYLE: Record<Strength, { bars: number; bar: string; text: string }> = {
  weak:   { bars: 1, bar: 'bg-red-500',     text: 'text-red-400' },
  okay:   { bars: 2, bar: 'bg-amber-500',   text: 'text-amber-400' },
  strong: { bars: 3, bar: 'bg-emerald-500', text: 'text-emerald-400' },
};

const MIN_PASSWORD = 6;
const STRONG_PASSWORD = 12;

function passwordStrength(pw: string): Strength | null {
  if (pw.length === 0) return null;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (pw.length >= STRONG_PASSWORD && variety >= 3) return 'strong';
  if (pw.length >= MIN_PASSWORD && variety >= 2) return 'okay';
  return 'weak';
}

/** Maydon ostidagi xato matni — label yo'q, shuning uchun aria-describedby orqali bog'lanadi */
function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="-mt-1 px-1 text-[12.5px] leading-snug text-[var(--ww-danger)]">
      {children}
    </p>
  );
}

export function RegisterForm({ onVerify }: Props) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const usernameError = username.length > 0 && !PATTERNS.USERNAME.test(username) ? t('usernamePattern') : undefined;
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD ? t('passwordMin')
    : password.length > 0 && !PATTERNS.PASSWORD.test(password) ? t('passwordPattern')
    : undefined;
  const strength = passwordStrength(password);
  const canSubmit = Boolean(username && email && password) && !usernameError && !passwordError && !isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    trackClick('register:submit');
    trackRegistrationStart(locale);

    setIsPending(true);
    try {
      await authApi.register({ username, email: email.trim(), password });
      trackRegistrationComplete(locale);
      onVerify(email.trim());
      return;
    } catch (err) {
      // Backend aniq sababni `errors` da yuboradi (Joi), `message` — umumiy "Validation failed"
      const data = err instanceof ApiError ? (err.data as { message?: string; errors?: string[] | null }) : null;
      setError(data?.errors?.[0] ?? data?.message ?? t('genericError'));
    }
    setIsPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5 text-center lg:text-left">
        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)]">
          {t('registerHeading')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('registerSub')}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Input
          type="text"
          icon={User}
          value={username}
          onChange={(e) => { setUsername(e.target.value.trim()); setError(''); }}
          placeholder={t('usernameLabel')}
          aria-label={t('usernameLabel')}
          aria-invalid={usernameError ? true : undefined}
          aria-describedby={usernameError ? 'reg-username-err' : undefined}
          required
          autoFocus
          autoComplete="username"
        />
        <FieldError id="reg-username-err">{usernameError}</FieldError>

        <Input
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder={t('emailPlaceholder')}
          aria-label={t('emailLabel')}
          required
          autoComplete="email"
          inputMode="email"
        />

        <PasswordInput
          icon={Lock}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder={t('passwordLabel')}
          aria-label={t('passwordLabel')}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? 'reg-password-err' : undefined}
          required
          autoComplete="new-password"
          toggleLabel={t('showPassword')}
        />
        <FieldError id="reg-password-err">{passwordError}</FieldError>

        {/* Kuch ko'rsatkichi — "parolni tasdiqlang" maydoni o'rniga (ko'z tugmasi
            yashirin xatoni allaqachon ko'rsatadi; ikkinchi maydon ortiqcha to'siq) */}
        {strength && !passwordError && (
          <div className="flex items-center gap-2 px-1" aria-hidden="true">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < STRENGTH_STYLE[strength].bars ? STRENGTH_STYLE[strength].bar : 'bg-[var(--ww-surface-2)]'
                  }`}
                />
              ))}
            </div>
            <span className={`text-[11px] font-medium capitalize ${STRENGTH_STYLE[strength].text}`}>{strength}</span>
          </div>
        )}

        {error && <Notice variant="danger">{error}</Notice>}

        <Button type="submit" variant="accent" size="xl" disabled={!canSubmit} className="mt-1 w-full font-semibold">
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t('register')}
        </Button>
      </form>

      <OrDivider />

      <SocialAuth source="register" disabled={isPending} onStart={() => setError('')} />

      <p className="text-center text-[13.5px] text-[var(--ww-text-3)]">
        {t('hasAccount')}{' '}
        <Link
          href={withRedirect('/login', searchParams.get('redirect'))}
          onClick={() => trackClick('register:go_to_login')}
          className="-my-1.5 inline-block py-1.5 font-semibold text-[var(--ww-accent-hi)] transition-colors hover:text-white"
        >
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
