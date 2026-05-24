import type { Metadata } from 'next';
import { ResetPasswordForm } from './ResetPasswordForm';

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
          <svg width="168" height="49" viewBox="0 0 200 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="wG" x1="4" y1="6" x2="44" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <path d="M 50,9 L 35,47 L 28,28 L 18,9" stroke="#5B21B6" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 6,9 L 21,47 L 28,28 L 40,9" stroke="url(#wG)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <text x="68" y="39" fontFamily="Arial,Helvetica,sans-serif" fontSize="28" fill="rgba(255,255,255,0.50)" fontWeight="300">we</text>
            <text x="103" y="39" fontFamily="Arial,Helvetica,sans-serif" fontSize="28" fill="#FFFFFF" fontWeight="800">Watch</text>
          </svg>
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
