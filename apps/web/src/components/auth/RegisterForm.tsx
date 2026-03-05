'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';

const registerSchema = z.object({
  username:        z.string().min(3, "Kamida 3 ta belgi").max(30, "Ko'pi bilan 30 ta belgi")
    .regex(/^[a-zA-Z0-9_]+$/, "Faqat harf, raqam va _ belgi"),
  email:           z.string().email("To'g'ri email kiriting"),
  password:        z.string().min(8, "Kamida 8 ta belgi"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ['confirmPassword'],
});

type RegisterFields = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const t = useTranslations('auth');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFields) => {
    setError('');
    try {
      await apiClient.post('/api/auth/register', {
        username:        data.username,
        email:           data.email,
        password:        data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? t('genericError'));
    }
  };

  if (success) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-display text-white mb-2">{t('emailVerifyTitle')}</h2>
        <p className="text-slate-400 text-sm mb-4">{t('emailVerifyText')}</p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full">
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-6">
      <h1 className="text-3xl font-display text-center text-white mb-2">CINESYNC</h1>
      <p className="text-center text-slate-400 text-sm mb-4">{t('registerTitle')}</p>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-white mb-1">{t('usernameLabel')}</label>
          <input
            {...register('username')}
            type="text"
            placeholder="username"
            className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            autoComplete="username"
          />
          {errors.username && (
            <label className="block text-xs text-red-400 mt-1">
              {errors.username.message}
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">{t('emailLabel')}</label>
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
          <label className="block text-sm font-medium text-white mb-1">{t('passwordLabel')}</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            autoComplete="new-password"
          />
          {errors.password && (
            <label className="block text-xs text-red-400 mt-1">
              {errors.password.message}
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-1">{t('confirmPasswordLabel')}</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
            className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <label className="block text-xs text-red-400 mt-1">
              {errors.confirmPassword.message}
            </label>
          )}
        </div>

        <button type="submit" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? <span className="animate-spin">⟳</span> : t('register')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-4">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">{t('loginLink')}</Link>
      </p>
    </div>
  );
}
