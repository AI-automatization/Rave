'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, XCircle, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { ApiError } from '@/lib/api-client';

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
    <div className="flex flex-col items-center gap-5">
      <Mail className="w-12 h-12 text-violet-400" strokeWidth={1.5} />
      <h1 className="text-xl font-bold text-white text-center">{t('emailVerifyTitle')}</h1>
      <p className="text-sm text-slate-400 text-center">
        {t('emailVerifyText')}<br />
        <span className="text-white font-medium">{email}</span>
      </p>

      {/* OTP inputs */}
      <div className="flex gap-2.5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isPending}
            className="w-11 h-13 bg-[#13121F] border border-[#2A2840] rounded-xl text-center text-lg font-bold text-white focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all disabled:opacity-50"
          />
        ))}
      </div>

      {isPending && (
        <Loader2 size={20} className="animate-spin text-violet-400" />
      )}

      {error && (
        <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5 w-full">
          <XCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
