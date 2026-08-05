import type { Metadata } from 'next';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';
import { AuthHero } from './AuthHero';
import { AuthFooter } from './AuthFooter';

// Auth sahifalari (login, register) qidiruvda indekslanmasligi kerak — aks holda
// Google ularni brend so'roviga ("wewatch") bosh sahifa o'rniga chiqaradi.
// follow:true — havolalar orqali bosh sahifaga link-equity o'tishi uchun.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // 100svh — mobil brauzerda 100vh manzil paneli ostiga kirib ketadi va
    // panelning pastki qismi kesiladi.
    //
    // Uch bosqichli tartib:
    //   < md   — faqat forma (banner umuman render qilinmaydi)
    //   md..lg — tepada 200px banner tasmasi, ostida forma
    //   ≥ lg   — ikki ustun: chapda banner (1.5), o'ngda forma (1)
    <div className="ww-auth-bg ww-auth-grid ww-grain relative min-h-[100svh] overflow-hidden md:grid md:grid-rows-[clamp(140px,20vh,200px)_1fr] lg:grid-cols-[1.5fr_1fr] lg:grid-rows-1">
      <AuthHero />

      {/* md:py-8 + md:gap-6 — 1280×800 (keng tarqalgan noutbuk) da ustun
          balandligi 830px chiqib, 30px ortiqcha scroll paydo bo'lardi.
          Chegara `lg` emas, `md`: 1023×800 da ham xuddi shu 30px chiqardi,
          chunki u hali lg ga yetmagan. px-4/py-8 — 320px kenglikdagi
          telefonda 132px ortiqcha scroll bor edi, har piksel hisobda. */}
      <main className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 py-8 sm:px-5 sm:py-10 md:min-h-0 md:py-8 lg:px-8">
        <div className="flex w-full max-w-[400px] flex-col items-center gap-6 sm:gap-8 md:gap-6">
          <WeWatchLogo iconSize={30} className="ww-rise transition-opacity hover:opacity-80" />

          <div className="ww-panel ww-rise w-full p-5 sm:p-7 lg:p-8" style={{ animationDelay: '60ms' }}>
            {children}
          </div>

          <div className="ww-rise" style={{ animationDelay: '120ms' }}>
            <AuthFooter />
          </div>
        </div>
      </main>
    </div>
  );
}
