'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse } from '@/types';

const loginSchema = z.object({
  email:    z.string().email("To'g'ri email kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgi"),
});

type LoginFields = z.infer<typeof loginSchema>;

interface LoginResponseData {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role: 'user' | 'operator' | 'admin' | 'superadmin';
    rank: string;
    totalPoints: number;
  };
  accessToken: string;
  refreshToken: string;
}

export function LoginForm() {
  const t = useTranslations('auth');
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => { router.prefetch('/home'); }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFields) => {
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json: ApiResponse<LoginResponseData> = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? t('wrongCredentials'));
        return;
      }
      const { user, accessToken, refreshToken } = json.data;
      setAuth(user, accessToken, refreshToken);
      router.replace('/home');
    } catch {
      setError(t('wrongCredentials'));
    }
  };

  return (
    <div className="bg-[#111118] rounded-2xl shadow-2xl border border-zinc-800 p-7">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-display text-white">
          CINE<span className="text-[#7C3AED]">SYNC</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('loginTitle')}</p>
      </div>

      {error && (
        <div className="text-red-400 text-sm rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            {t('emailLabel')}
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="email@example.com"
            className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60 transition-colors"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-1.5">
            <span>{t('passwordLabel')}</span>
            <Link href="/forgot-password" className="text-xs text-[#7C3AED] hover:text-violet-400 transition-colors">
              {t('forgotPassword')}
            </Link>
          </label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60 transition-colors"
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all active:scale-95 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <span className="animate-spin inline-block">⟳</span> : t('login')}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-5">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-[#7C3AED] hover:text-violet-400 transition-colors font-medium">
          {t('registerLink')}
        </Link>
      </p>
    </div>
  );
}
