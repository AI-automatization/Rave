import type { Metadata } from 'next';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';
import { AuthHero } from './AuthHero';
import { AuthFooter } from './AuthFooter';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * Auth sahifalari tartibi (2026-11-14, noldan qayta qurilgan).
 *
 * Asosiy talab — sahifa ekranga TO'LIQ sig'sin, butun sahifa scroll bo'lmasin:
 *  • `< lg` — faqat forma, mobil ilovadagi kabi: tepada logo, ostida forma,
 *    karta/quti yo'q (telefonda karta chegarasi faqat joy yeydi).
 *  • `≥ lg` — ikki ustun: chapda banner, o'ngda forma. Har ikkisi aniq
 *    `100svh` balandlikda; forma ustuni juda past ekranda (≤ 640px) faqat
 *    O'ZI ichida scroll qiladi, banner esa joyida turadi.
 *
 * Ilgari md..lg oralig'ida tepada 200px banner tasmasi bor edi — u formani
 * pastga surib, noutbuk/planshetlarda sahifani scroll qildirardi.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ww-auth-bg relative min-h-[100svh] lg:grid lg:h-[100svh] lg:grid-cols-[minmax(0,1.25fr)_minmax(440px,1fr)] lg:overflow-hidden">
      <AuthHero />

      <main className="relative z-10 flex min-h-[100svh] flex-col overflow-y-auto px-5 lg:h-[100svh] lg:min-h-0 lg:border-l lg:border-[var(--ww-line)] lg:px-10">
        {/* my-auto — kontent sig'sa vertikal markazda, sig'masa yuqoridan
            boshlanib scroll bo'ladi (justify-center bilan tepasi kesilardi). */}
        <div className="mx-auto my-auto flex w-full max-w-[380px] flex-col items-center gap-6 py-6">
          {/* Banner ichida logo bor — katta ekranda forma ustida takrorlanmaydi */}
          <WeWatchLogo iconSize={28} className="ww-rise transition-opacity hover:opacity-80 lg:hidden" />

          <div className="ww-rise w-full" style={{ animationDelay: '60ms' }}>
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
