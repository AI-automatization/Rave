'use client';

/**
 * Kirish formasi (2026-11-14, noldan qayta yozilgan). Tuzilma mobil
 * ilovadagi LoginScreen bilan bir xil: sarlavha → email → parol →
 * "unutdingizmi?" → Kirish → "yoki" → Google (Telegram 2026-11-14 da olib tashlandi).
 *
 * Maydonlarda ko'rinadigan label yo'q (mobil kabi ikonka + placeholder) —
 * har maydonga ~28px tejaladi va forma noutbuk ekraniga to'liq sig'adi.
 * Label skrinrider uchun `aria-label` da qoladi.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Lock, Loader2, ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { safeRedirect, withRedirect } from '@/lib/safe-redirect';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SocialAuth, OrDivider } from '../SocialAuth';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [banReason, setBanReason] = useState<string | null | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || isPending) return;
    trackClick('login:submit');

    // useTransition emas: React 18 da async ishni kutmaydi va isPending darhol false bo'lardi
    setIsPending(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      setUser(res.data?.user ?? null);
      // Muvaffaqiyatda isPending qoldiriladi — sahifa almashguncha tugma qayta bosilmasin
      router.push(safeRedirect(searchParams.get('redirect')));
      return;
    } catch (err) {
      const data = err instanceof ApiError
        ? (err.data as { message?: string; code?: string; reason?: string; errors?: string[] | null })
        : null;
      if (data?.code === 'ACCOUNT_BLOCKED') {
        setBanReason(data.reason ?? null);
        setError('');
      } else {
        setBanReason(undefined);
        // `errors` (Joi aniq sababi) umumiy "Validation failed" dan foydaliroq
        setError(data ? (data.errors?.[0] ?? data.message ?? t('wrongCredentials')) : t('genericError'));
      }
    }
    setIsPending(false);
  }

  const canSubmit = Boolean(email && password) && !isPending;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5 text-center lg:text-left">
        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)]">
          {t('welcomeBack')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('welcomeBackSub')}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Input
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder={t('emailPlaceholder')}
          aria-label={t('emailLabel')}
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
        />

        <PasswordInput
          icon={Lock}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder={t('passwordPlaceholder')}
          aria-label={t('passwordLabel')}
          required
          autoComplete="current-password"
          toggleLabel={t('showPassword')}
        />

        <div className="-mt-0.5 flex justify-end">
          {/* /auth/reset-password emaildagi tokenni kutadi — so'rov formasi shu yerda */}
          <Link
            href="/auth/forgot-password"
            onClick={() => trackClick('login:forgot_password')}
            className="-my-1.5 inline-block py-1.5 text-[12.5px] font-medium text-[var(--ww-text-3)] transition-colors hover:text-[var(--ww-accent-hi)]"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        {banReason !== undefined && (
          <Notice variant="danger" icon={ShieldX} title={t('bannedTitle')}>
            {banReason && <p>{t('bannedReason', { reason: banReason })}</p>}
            <p className="mt-1 text-[var(--ww-text-3)]">{t('bannedHint')}</p>
          </Notice>
        )}

        {error && <Notice variant="danger">{error}</Notice>}

        <Button type="submit" variant="accent" size="xl" disabled={!canSubmit} className="w-full font-semibold">
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {t('login')}
        </Button>
      </form>

      <OrDivider />

      <SocialAuth source="login" disabled={isPending} onStart={() => setError('')} />

      <p className="text-center text-[13.5px] text-[var(--ww-text-3)]">
        {t('noAccount')}{' '}
        <Link
          href={withRedirect('/register', searchParams.get('redirect'))}
          onClick={() => trackClick('login:go_to_register')}
          className="-my-1.5 inline-block py-1.5 font-semibold text-[var(--ww-accent-hi)] transition-colors hover:text-white"
        >
          {t('registerLink')}
        </Link>
      </p>
    </div>
  );
}
