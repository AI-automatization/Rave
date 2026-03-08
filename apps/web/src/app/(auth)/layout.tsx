import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0F]">
      {/* Violet glow background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/14 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#4C1D95]/18 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-[#6D28D9]/15 rounded-full blur-[70px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
