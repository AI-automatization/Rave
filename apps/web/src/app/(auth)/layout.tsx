import Link from 'next/link';
import { WIcon } from '@/components/common/WeWatchLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090F] px-4 py-8">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="WeWatch">
          <WIcon size={32} />
          <span className="font-extrabold text-xl tracking-tight text-white">
            We<span style={{ color: '#6231EF' }}>Watch</span>
          </span>
        </Link>

        {/* Card */}
        <div className="w-full bg-[#0F0E1A]/80 backdrop-blur-xl border border-[#1E1D2E] rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
