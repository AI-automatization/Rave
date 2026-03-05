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
    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
      <h1 className="text-3xl font-display text-center text-white mb-2">CINESYNC</h1>
      <p className="text-center text-slate-400 text-sm mb-4">{t('loginTitle')}</p>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            {t('emailLabel')}
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="email@example.com"
            className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            autoComplete="email"
          />
          {errors.email && (
            <label className="block text-xs text-red-400 mt-1">
              {errors.email.message}
            </label>
          )}
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-white mb-1">
            <span>{t('passwordLabel')}</span>
            <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              {t('forgotPassword')}
            </Link>
          </label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            autoComplete="current-password"
          />
          {errors.password && (
            <label className="block text-xs text-red-400 mt-1">
              {errors.password.message}
            </label>
          )}
        </div>

        <button type="submit" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? <span className="animate-spin">⟳</span> : t('login')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-4">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">{t('registerLink')}</Link>
      </p>
    </div>
  );
}
