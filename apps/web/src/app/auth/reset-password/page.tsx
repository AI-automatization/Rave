import type { Metadata } from 'next';
import { ResetPasswordForm } from './ResetPasswordForm';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';

export const metadata: Metadata = {
  title: 'Сброс пароля',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%), #09090F',
      }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <WeWatchLogo variant="stacked" iconSize={48} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#0F0E1A',
            border: '1px solid #1E1C30',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #7C3AED 50%, transparent 100%)' }} />

          <div className="px-7 py-8">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.12em] mb-2">
              Безопасность аккаунта
            </p>
            <h1 className="text-2xl font-extrabold text-white mb-2">Новый пароль</h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-7">
              Придумайте надёжный пароль для вашего аккаунта WeWatch.
            </p>

            <ResetPasswordForm token={token ?? null} />
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #1E1C30' }}>
            <p className="text-center text-[11px] text-[#3C3A58] py-4">
              © 2025 WeWatch · noreply@wewatch.uz
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
