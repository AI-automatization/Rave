'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      setError(msg ?? "Xatolik yuz berdi, qayta urinib ko'ring");
    }
  };

  if (success) {
    return (
      <div className="card bg-bg-elevated shadow-xl">
        <div className="card-body items-center text-center gap-4">
          <div className="text-5xl">✉️</div>
          <h2 className="text-xl font-display text-white">EMAIL TASDIQLANG</h2>
          <p className="text-base-content/60 text-sm">
            Emailingizga tasdiqlash xati yuborildi. Iltimos tekshiring.
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Kirish sahifasiga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-bg-elevated shadow-xl">
      <div className="card-body gap-4">
        <h1 className="text-3xl font-display text-center text-white">
          CINESYNC
        </h1>
        <p className="text-center text-base-content/60 text-sm">Yangi hisob yarating</p>

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Foydalanuvchi nomi</span></label>
            <input
              {...register('username')}
              type="text"
              placeholder="username"
              className="input input-bordered w-full bg-bg-surface"
              autoComplete="username"
            />
            {errors.username && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.username.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
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
            <label className="label"><span className="label-text">Parol</span></label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full bg-bg-surface"
              autoComplete="new-password"
            />
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Parolni tasdiqlang</span></label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full bg-bg-surface"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <span className="loading loading-spinner loading-sm" />
              : "Ro'yxatdan o'ting"}
          </button>
        </form>

        <p className="text-center text-sm text-base-content/60">
          Hisob bormi?{' '}
          <Link href="/login" className="link link-primary">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
