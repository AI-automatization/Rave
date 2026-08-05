'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, MailCheck, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { trackClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';

// Sahifaning butun mazmuni shu client komponentda (ilgari sarlavha alohida
// `ForgotPasswordHeader` eksporti edi): `page.tsx` server komponenti bo'lishi
// shart — u `metadata` eksport qiladi — locale esa faqat clientda ma'lum
// (cookie → NextIntlClientProvider), ya'ni tarjima qilinadigan har qanday
// markup shu yerda render bo'ladi.
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
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        {/* Ikki qatlamli medalyon — yolg'iz ikonka qorong'i panelda "osilib"
            qoladi, halqa unga o'lcham va markaz beradi */}
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[var(--ww-line)]" />
          <span className="absolute inset-2 rounded-full bg-[rgba(74,222,128,0.10)]" />
          <MailCheck
            size={26}
            strokeWidth={1.6}
            aria-hidden="true"
            className="relative text-[var(--ww-success)]"
          />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ww-text)]">
            {t('forgotSent')}
          </h1>
          <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-3)]">
            {t('forgotSentHint', { email })}
          </p>
        </div>

        <Button asChild variant="accent" size="xl" className="mt-1 w-full font-semibold">
          <Link href="/login" onClick={() => trackClick('forgot_password:back_to_login')}>
            {t('forgotBackToLogin')}
          </Link>
        </Button>
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
    <div className="flex flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="text-[25px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)] sm:text-[28px]">
          {t('forgotHeading')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('forgotSubtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5" noValidate>
        <Field label={t('emailLabel')}>
          <Input
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus('idle');
            }}
            placeholder={t('emailPlaceholder')}
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
          />
        </Field>

        {status === 'error' && <Notice variant="danger">{errorMsg}</Notice>}

        <Button
          type="submit"
          variant="accent"
          size="xl"
          disabled={isPending || !email}
          className="group mt-1 w-full font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t('forgotSending')}
            </>
          ) : (
            <>
              {t('forgotSubmit')}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-[var(--ww-text-3)]">
        <Link
          href="/login"
          onClick={() => trackClick('forgot_password:back_to_login')}
          /* -my-1.5 py-1.5 — bosish balandligi 19px dan 31px ga ko'tariladi
             (WCAG 2.2 minimumi 24px), tartibda esa hech narsa siljimaydi */
          className="-my-1.5 inline-flex items-center gap-1.5 py-1.5 font-medium text-[var(--ww-accent-hi)] transition-colors hover:text-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t('forgotBackToLogin')}
        </Link>
      </p>
    </div>
  );
}
