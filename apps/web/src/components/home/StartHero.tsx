'use client';

/**
 * Bosh sahifaning "langar" bloki — jonli xona BO'LMAGANDA `LiveSpotlight`
 * o'rnini egallaydi.
 *
 * Nega kerak: ilgari xonalar bo'lmasa sahifada faqat kulrang quti qolardi,
 * o'rtasida kichkina ikonka va ko'p bo'sh joy — mahsulot "bo'sh" ko'rinardi.
 * Aynan shu ekranni yangi foydalanuvchi BIRINCHI ko'radi, ya'ni retention
 * shu yerda hal bo'ladi. Endi langar joyi hech qachon bo'sh qolmaydi: yo
 * jonli xona, yo shu blok — ikkalasi bir xil balandlik va vaznda.
 *
 * Qo'llab-quvvatlanadigan manbalar ro'yxati bu yerda ataylab: yangi
 * foydalanuvchining birinchi savoli "nimani ko'ra olaman?" bo'ladi
 * (brief: YouTube, VK Video, Rutube, to'g'ridan-to'g'ri havolalar).
 */

import { useTranslations } from 'next-intl';
import { Plus, LogIn, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SOURCES = [
  { label: 'YouTube', color: '#FF0000' },
  { label: 'VK Video', color: '#0077FF' },
  { label: 'Rutube', color: '#FF6600' },
] as const;

interface Props {
  onCreate: () => void;
  onJoin: () => void;
}

export function StartHero({ onCreate, onJoin }: Props) {
  const t = useTranslations('home');

  return (
    <section
      className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[var(--ww-r-xl)] border border-[var(--ww-line)] p-5 sm:min-h-[380px] sm:p-7"
      style={{
        background:
          'radial-gradient(ellipse 70% 60% at 15% 10%, rgba(124,58,237,0.22) 0%, transparent 62%), radial-gradient(ellipse 50% 60% at 90% 100%, rgba(34,211,238,0.10) 0%, transparent 58%), linear-gradient(160deg,#120E22 0%,#0A0813 100%)',
      }}
    >
      {/* Qadamlar — yuqorida, chunki asosiy harakat pastda va oxirgi ko'riladi */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px] text-[var(--ww-text-3)]">
        {[t('step1'), t('step2'), t('step3')].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            {/* Strelka faqat keng ekranda: mobilda ro'yxat ko'chganda strelka
                yangi satr boshiga tushib, "→ 3 Birga tomosha" ko'rinishida
                osilib qolardi */}
            {i > 0 && (
              <span aria-hidden="true" className="hidden text-[var(--ww-text-4)] sm:inline">
                →
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ww-surface-3)] text-[10px] font-bold text-[var(--ww-text-2)]">
                {i + 1}
              </span>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-6">
        <div className="max-w-[30rem]">
          <h2 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[38px]">
            {t('startTitle')}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--ww-text-2)]">
            {t('startSub')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" size="xl" onClick={onCreate} className="font-semibold">
            <Plus size={16} aria-hidden="true" />
            {t('quickCreate')}
          </Button>
          <Button variant="subtle" size="xl" onClick={onJoin}>
            <LogIn size={16} aria-hidden="true" />
            {t('quickJoin')}
          </Button>
        </div>

        {/* Manbalar — "nimani ko'ra olaman?" savoliga darhol javob */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ww-text-4)]">
            {t('startSources')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {SOURCES.map(({ label, color }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-2.5 py-1 text-[11.5px] text-[var(--ww-text-2)]"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: color }}
                />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)] px-2.5 py-1 text-[11.5px] text-[var(--ww-text-2)]">
              <Link2 size={11} aria-hidden="true" className="text-[var(--ww-text-4)]" />
              {t('startDirect')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
