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
      <div className="bg-[#111118] rounded-2xl shadow-2xl border border-zinc-800 p-7 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-display text-white mb-2">{t('emailVerifyTitle')}</h2>
        <p className="text-zinc-500 text-sm mb-5">{t('emailVerifyText')}</p>
        <Link href="/login" className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all active:scale-95 w-full">
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111118] rounded-2xl shadow-2xl border border-zinc-800 p-7">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-display text-white">
          CINE<span className="text-[#7C3AED]">SYNC</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t('registerTitle')}</p>
      </div>

      {error && (
        <div className="text-red-400 text-sm rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('usernameLabel')}</label>
          <input
            {...register('username')}
            type="text"
            placeholder="username"
            className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60 transition-colors"
            autoComplete="username"
          />
          {errors.username && (
            <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('emailLabel')}</label>
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
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('passwordLabel')}</label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60 transition-colors"
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('confirmPasswordLabel')}</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
            className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60 transition-colors"
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all active:scale-95 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <span className="animate-spin inline-block">⟳</span> : t('register')}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-5">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-[#7C3AED] hover:text-violet-400 transition-colors font-medium">
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
