'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
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
}

export function LoginForm() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFields) => {
    setError('');
    try {
      const res = await apiClient.post<ApiResponse<LoginResponseData>>(
        '/auth/login',
        data,
      );
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      router.push('/home');
    } catch {
      setError("Email yoki parol noto'g'ri");
    }
  };

  return (
    <div className="card bg-bg-elevated shadow-xl">
      <div className="card-body gap-4">
        <h1 className="text-3xl font-display text-center text-white">
          CINESYNC
        </h1>
        <p className="text-center text-base-content/60 text-sm">Hisobingizga kiring</p>

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="email@example.com"
              className="input input-bordered w-full bg-bg-surface"
              autoComplete="email"
            />
            {errors.email && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.email.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Parol</span>
              <Link href="/forgot-password" className="label-text-alt link link-primary">
                Unutdingizmi?
              </Link>
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full bg-bg-surface"
              autoComplete="current-password"
            />
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password.message}</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Kirish'}
          </button>
        </form>

        <p className="text-center text-sm text-base-content/60">
          Hisob yo&apos;qmi?{' '}
          <Link href="/register" className="link link-primary">
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </p>
      </div>
    </div>
  );
}
