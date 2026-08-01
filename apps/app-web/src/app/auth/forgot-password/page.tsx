import type { Metadata } from 'next';
import { ForgotPasswordForm, ForgotPasswordHeader } from './ForgotPasswordForm';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';

// Static title for the same reason as ../reset-password/page.tsx: server component, locale lives
// in a client-side cookie, so the tab title can't follow the language switcher. Default locale (uz).
export const metadata: Metadata = {
  title: 'Parolni tiklash so\'rovi',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
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
            <ForgotPasswordHeader />

            <ForgotPasswordForm />
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #1E1C30' }}>
            <p className="text-center text-[11px] text-[#3C3A58] py-4">
              © 2026 WeWatch · noreply@wewatch.uz
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
