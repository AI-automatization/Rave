'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { FaPlay, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse } from '@/types';

const loginSchema = z.object({
  email:    z.string().email("To'g'ri email kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
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
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError]           = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        // Show the first specific error from the array, fallback to generic message
        const detail = json.errors?.[0] ?? json.message ?? t('wrongCredentials');
        setError(detail);
        return;
      }
      const { user, accessToken, refreshToken } = json.data;
      setAuth(user, accessToken, refreshToken);
      // Hard navigation ensures the middleware sees the cookie immediately
      window.location.replace('/home');
    } catch {
      setError(t('wrongCredentials'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="bg-[#111118] rounded-2xl border border-zinc-800 shadow-[0_0_60px_rgba(124,58,237,0.12)] p-7"
    >
      {/* Logo */}
      <div className="text-center mb-7">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.5)]">
            <FaPlay size={11} className="text-white ml-0.5" />
          </div>
          <span className="text-2xl font-display text-white tracking-wide">
            CINE<span className="text-[#7C3AED]">SYNC</span>
          </span>
        </Link>
        <p className="text-zinc-500 text-sm">{t('loginTitle')}</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm rounded-xl bg-red-500/8 border border-red-500/25 p-3 mb-5"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            {t('emailLabel')}
          </label>
          <div className="relative">
            <FaEnvelope size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              {...register('email')}
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/50 transition-all duration-200 hover:border-zinc-700"
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-1.5">
            <span>{t('passwordLabel')}</span>
            <Link href="/forgot-password" className="text-xs text-[#7C3AED] hover:text-violet-400 transition-colors">
              {t('forgotPassword')}
            </Link>
          </label>
          <div className="relative">
            <FaLock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full h-11 pl-9 pr-10 rounded-xl bg-[#0A0A0F] border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/50 transition-all duration-200 hover:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] hover:shadow-[0_0_30px_rgba(124,58,237,0.55)] transition-all duration-300 active:scale-[0.98] mt-1 disabled:opacity-55 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span className="text-sm">{t('login')}...</span>
            </>
          ) : t('login')}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-5">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-[#7C3AED] hover:text-violet-400 transition-colors font-medium">
          {t('registerLink')}
        </Link>
      </p>
    </motion.div>
  );
}
