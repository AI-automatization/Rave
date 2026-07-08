import type { Metadata } from 'next';
import Link from 'next/link';
import { WIcon } from '@/components/common/WeWatchLogo';

// Auth sahifalari (login, register) qidiruvda indekslanmasligi kerak — aks holda
// Google ularni brend so'roviga ("wewatch") bosh sahifa o'rniga chiqaradi.
// follow:true — havolalar orqali bosh sahifaga link-equity o'tishi uchun.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background: [
          'radial-gradient(ellipse 90% 75% at 50% 0%, rgba(124,58,237,0.70) 0%, rgba(109,40,217,0.30) 45%, transparent 65%)',
          'radial-gradient(ellipse 50% 40% at 85% 95%, rgba(34,211,238,0.22) 0%, transparent 55%)',
          'radial-gradient(ellipse 40% 35% at 15% 80%, rgba(139,92,246,0.25) 0%, transparent 50%)',
          '#06050E',
        ].join(', '),
      }}
    >

      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-7">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="WeWatch">
          <WIcon size={28} />
          <span className="font-bold text-[17px] tracking-tight text-white">
            We<span style={{ color: '#7C3AED' }}>Watch</span>
          </span>
        </Link>

        {/* Card — Liquid Glass */}
        <div className="liquid-glass w-full p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
