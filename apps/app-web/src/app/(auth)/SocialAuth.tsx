'use client';

/**
 * "Google orqali davom etish" — login va register sahifalari uchun YAGONA
 * manba (ilgari faqat LoginForm ichida edi va /register sahifasida Google
 * tugmasi umuman yo'q edi). Telegram (bot) orqali kirish 2026-11-14 da
 * olib tashlandi — faqat Google + email.
 *
 * Ko'rinish mobil ilovadagi `SocialAuthButtons` bilan bir xil: keng tugma,
 * Google brend gradient chegarasi + rangli "G".
 *
 * Oqim: oddiy to'liq sahifali redirect — /api/auth/google/start → auth
 * service passport → Google → /auth/callback. Popup emas: Google'ning COOP
 * siyosati window.opener'ni uzib, popup+poll mobil brauzerlarda buzilardi
 * (T-S132/T-S134). Yangi foydalanuvchi uchun auth service akkauntni o'zi
 * yaratadi — ya'ni bitta tugma ham "kirish", ham "ro'yxatdan o'tish".
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { trackClick } from '@/lib/analytics';

export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface SocialAuthProps {
  /** Analitika uchun: qaysi sahifadan bosildi */
  source: 'login' | 'register';
  /** Forma yuborilayotganda tugma o'chadi */
  disabled?: boolean;
  /** Yangi urinishda forma xatosini tozalash uchun */
  onStart?: () => void;
}

export function SocialAuth({ source, disabled, onStart }: SocialAuthProps) {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // bfcache: Google'dan "orqaga" qaytilganda sahifa eski holatida (spinner bilan)
    // tiklanadi — tugma qayta bosiladigan bo'lsin.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  function handleGoogle() {
    trackClick(`${source}:google`);
    onStart?.();
    setBusy(true);
    const redirect = searchParams.get('redirect');
    window.location.href = redirect
      ? `/api/auth/google/start?redirect=${encodeURIComponent(redirect)}`
      : '/api/auth/google/start';
  }

  return (
    <button
      type="button"
      className="ww-oauth-btn"
      onClick={handleGoogle}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleLogo />}
      {busy ? t('loggingIn') : t('continueWithGoogle')}
    </button>
  );
}

/** "yoki" ajratgichi — ikkala formada bir xil */
export function OrDivider() {
  const t = useTranslations('auth');
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--ww-line)]" />
      <span className="text-[11.5px] uppercase tracking-[0.14em] text-[var(--ww-text-4)]">{t('orDivider')}</span>
      <span className="h-px flex-1 bg-[var(--ww-line)]" />
    </div>
  );
}
