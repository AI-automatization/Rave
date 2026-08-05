'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';

interface Props {
  onVerify: (email: string) => void;
}

export function RegisterForm({ onVerify }: Props) {
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch || tooShort || !username || !email || !password) return;
    trackClick('register:submit');

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

  const disabled =
    isPending || mismatch || tooShort || !username || !email || !password || !confirm;

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

        <Field label={t('passwordLabel')} error={tooShort ? t('passwordMin') : undefined}>
          <PasswordInput
            icon={Lock}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required
            autoComplete="new-password"
            toggleLabel={t('showPassword')}
          />
        </Field>

        <Field label={t('confirmPasswordLabel')} error={mismatch ? t('passwordMismatch') : undefined}>
          <PasswordInput
            icon={Lock}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            required
            autoComplete="new-password"
            toggleLabel={t('showPassword')}
          />
        </Field>

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
