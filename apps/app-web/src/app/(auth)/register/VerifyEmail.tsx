'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';
import { Notice } from '@/components/ui/notice';

interface Props {
  email: string;
}

const CODE_LENGTH = 6;

export function VerifyEmail({ email }: Props) {
  const t = useTranslations('auth');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const next = [...digits];

    // Handle paste
    if (value.length > 1) {
      const chars = value.slice(0, CODE_LENGTH).split('');
      for (let i = 0; i < CODE_LENGTH; i++) {
        next[i] = chars[i] ?? '';
      }
      setDigits(next);
      inputRefs.current[Math.min(chars.length, CODE_LENGTH - 1)]?.focus();
      if (chars.length === CODE_LENGTH) {
        submitCode(next.join(''));
      }
      return;
    }

    next[index] = value;
    setDigits(next);
    setError('');

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d) && next.join('').length === CODE_LENGTH) {
      submitCode(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function submitCode(code: string) {
    startTransition(() => {
      void (async () => {
        try {
          const res = await authApi.confirmEmail({ email, code });
          setUser(res.data?.user ?? null);
          router.push('/home');
        } catch (err) {
          if (err instanceof ApiError) {
            const data = err.data as { message?: string };
            setError(data.message ?? t('genericError'));
          } else {
            setError(t('genericError'));
          }
          setDigits(Array(CODE_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }
      })();
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Ikki qatlamli medalyon — login/forgot dagi natija ekranlari bilan
          bir xil shakl, ya'ni auth oqimi bo'ylab bitta til */}
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[var(--ww-line)]" />
        <span className="absolute inset-2 rounded-full bg-[var(--ww-accent-soft)]" />
        <MailCheck
          size={26}
          strokeWidth={1.6}
          aria-hidden="true"
          className="relative text-[var(--ww-accent-hi)]"
        />
      </span>

      <div className="flex flex-col gap-2">
        {/* Ilgari BOSH HARFLAR bilan yozilgan matn edi ("EMAIL TASDIQLANG") —
            ekran o'quvchilar uni harflab o'qiydi va sahifadagi boshqa
            sarlavhalar bilan bir tizimda emas edi */}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ww-text)]">
          {t('emailVerifyTitle')}
        </h1>
        <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-3)]">
          {t('emailVerifyText')}
          <br />
          <span className="font-medium text-[var(--ww-text)]">{email}</span>
        </p>
      </div>

      {/* Kod maydonlari. Ilgari `w-11 h-13` edi — Tailwind'da `h-13` klassi
          umuman mavjud emas, balandlik matn bo'yicha hisoblanib katakchalar
          past va bir tekis emas edi. O'lcham endi `.ww-otp` da (globals.css). */}
      <div className="flex justify-center gap-2 sm:gap-2.5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            /* maxLength bitta emas — kod bir katakka to'liq joylashtirilganda
               (paste) `handleChange` uni oltita katakka taqsimlaydi */
            maxLength={CODE_LENGTH}
            /* Faqat birinchisida: brauzer SMS/email kodini avtomatik to'ldirsa
               u baribir paste yo'li bilan qolganlariga tarqaladi */
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={i === 0}
            aria-label={t('emailVerifyDigit', { n: i + 1 })}
            aria-invalid={error ? true : undefined}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isPending}
            className="ww-field ww-otp"
          />
        ))}
      </div>

      {/* aria-live — kod avtomatik yuboriladi, ya'ni ekran o'quvchi
          foydalanuvchi hech narsa bosmasa ham nima bo'layotganini bilishi kerak */}
      <p
        aria-live="polite"
        className="flex min-h-[20px] items-center gap-2 text-[13px] text-[var(--ww-text-3)]"
      >
        {isPending && (
          <>
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            {t('emailVerifyChecking')}
          </>
        )}
      </p>

      {error && (
        <Notice variant="danger" className="w-full text-left">
          {error}
        </Notice>
      )}
    </div>
  );
}
