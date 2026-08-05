'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Lock, ShieldX, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { trackClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Field, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';

interface Props {
  token: string | null;
}

/**
 * Natija ekranlari uchun umumiy qobiq (yaroqsiz havola / muvaffaqiyat).
 * Ikkalasi bir xil shaklda bo'lishi kerak — faqat rang, ikonka va matn
 * farq qiladi, tuzilma emas.
 */
function ResultState({
  icon: Icon,
  tone,
  title,
  hint,
  action,
}: {
  icon: React.ElementType;
  tone: 'danger' | 'success';
  title: string;
  hint: string;
  action: React.ReactNode;
}) {
  const color = tone === 'danger' ? 'var(--ww-danger)' : 'var(--ww-success)';
  const halo = tone === 'danger' ? 'rgba(255,107,107,0.10)' : 'rgba(74,222,128,0.10)';

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      {/* Ikki qatlamli medalyon — yolg'iz ikonka qorong'i panelda "osilib"
          qoladi, halqa unga o'lcham va markaz beradi */}
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[var(--ww-line)]" />
        <span className="absolute inset-2 rounded-full" style={{ background: halo }} />
        <Icon
          size={26}
          strokeWidth={1.6}
          aria-hidden="true"
          className="relative"
          style={{ color }}
        />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ww-text)]">
          {title}
        </h1>
        <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-3)]">{hint}</p>
      </div>

      {action}
    </div>
  );
}

// Lives here rather than in page.tsx because that page is a server component: the locale is only
// known on the client (cookie → locale.store → NextIntlClientProvider), so anything translated has
// to render client-side.
export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <ResultState
        icon={ShieldX}
        tone="danger"
        title={t('resetLinkInvalid')}
        hint={t('resetLinkInvalidHint')}
        action={
          /* Dead end until 2026-08-01: the hint told the user to request a new link "in the app",
             with nothing to click on the web. There is now a request form — send them there. */
          <Button asChild variant="accent" size="xl" className="mt-1 w-full font-semibold">
            <Link
              href="/auth/forgot-password"
              onClick={() => trackClick('reset_password:request_new_link')}
            >
              {t('forgotSubmit')}
            </Link>
          </Button>
        }
      />
    );
  }

  if (status === 'success') {
    return (
      <ResultState
        icon={CheckCircle2}
        tone="success"
        title={t('resetSuccess')}
        hint={t('resetSuccessHint')}
        action={
          <div className="flex w-full flex-col gap-3">
            {/* `wewatch://` — ichki marshrut emas, mobil ilova sxemasi,
                shuning uchun `Link` emas, oddiy `<a>` */}
            <Button asChild variant="accent" size="xl" className="w-full font-semibold">
              <a href="wewatch://" onClick={() => trackClick('reset_password:open_app')}>
                {t('resetOpenApp')}
              </a>
            </Button>
            {/* Ilova o'rnatilmagan bo'lsa `wewatch://` hech qayerga olib
                bormaydi va ekran boshi berk ko'chaga aylanardi — brauzerda
                davom etish yo'li ochiq qolsin */}
            <Button asChild variant="subtle" size="xl" className="w-full">
              <Link href="/login" onClick={() => trackClick('reset_password:back_to_login')}>
                {t('forgotBackToLogin')}
              </Link>
            </Button>
          </div>
        }
      />
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

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
            const data = (await res.json()) as { message?: string };
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
    <div className="flex flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-2">
        <h1 className="text-[25px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ww-text)] sm:text-[28px]">
          {t('resetHeading')}
        </h1>
        <p className="text-[14px] leading-relaxed text-[var(--ww-text-3)]">{t('resetSubtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5" noValidate>
        {/* hint — talab OLDINDAN ko'rinadi; ilgari 8 belgi qoidasi faqat
            buzilgandan keyin xato sifatida chiqardi */}
        <Field
          label={t('resetNewPasswordLabel')}
          error={tooShort ? t('passwordMin') : undefined}
          hint={t('passwordMin')}
        >
          <PasswordInput
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus('idle');
            }}
            required
            autoFocus
            autoComplete="new-password"
            toggleLabel={t('showPassword')}
          />
        </Field>

        <Field label={t('resetRepeatLabel')} error={mismatch ? t('passwordMismatch') : undefined}>
          <PasswordInput
            icon={Lock}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setStatus('idle');
            }}
            required
            autoComplete="new-password"
            toggleLabel={t('showPassword')}
          />
        </Field>

        {status === 'error' && <Notice variant="danger">{errorMsg}</Notice>}

        <Button
          type="submit"
          variant="accent"
          size="xl"
          disabled={isPending || mismatch || tooShort || !password || !confirm}
          className="group mt-1 w-full font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t('resetSaving')}
            </>
          ) : (
            <>
              {t('resetSubmit')}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
