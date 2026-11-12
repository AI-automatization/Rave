'use client';

// Alohida client komponent, chunki layout.tsx server komponenti bo'lishi kerak
// (u `metadata` eksport qiladi), next-intl esa bu loyihada faqat clientda
// ishlaydi — locale cookie'dan o'qilib NextIntlClientProvider'ga beriladi
// (components/common/Providers.tsx:35). Ya'ni serverda `t()` mavjud emas.

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function AuthFooter() {
  const t = useTranslations('auth');

  return (
    // -my-2 py-2 — havolalar balandligi 16px edi, WCAG 2.2 minimumi 24px.
    // Manfiy margin tartibni o'zgarishsiz qoldiradi.
    <p className="text-center text-[12.5px] leading-relaxed text-[var(--ww-text-4)]">
      <Link
        href="/support"
        className="-my-2 inline-block py-2 transition-colors hover:text-[var(--ww-text-2)]"
      >
        {t('help')}
      </Link>
      <span aria-hidden="true" className="px-2 opacity-40">
        ·
      </span>
      <Link
        href="/"
        className="-my-2 inline-block py-2 transition-colors hover:text-[var(--ww-text-2)]"
      >
        {t('backToSite')}
      </Link>
    </p>
  );
}
