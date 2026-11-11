'use client';

import { useTranslations } from 'next-intl';
import { useProfile } from '@/hooks/use-profile';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { StatsGrid } from '@/components/profile/StatsGrid';

/** Karta shaklidagi skeleton — markazdagi spinner sahifa balandligini
    yig'ib qo'yardi va ma'lumot kelganda tartib sakrardi (/home, /friends,
    /notifications bilan bir xil yondashuv). */
function ProfileSkeleton() {
  return (
    <div className="ww-panel flex flex-col items-center gap-6 p-6" aria-busy="true">
      <div className="skeleton h-24 w-24 rounded-full" />
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-12 w-full rounded-[var(--ww-r-md)]" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-[6.5rem] w-full rounded-[var(--ww-r-md)]" />
        </div>
      </div>
    </div>
  );
}

export function ProfileContent() {
  const t = useTranslations('profile');
  const { data: user, isLoading } = useProfile();

  return (
    // `max-w-xl` on every breakpoint left roughly half of a 1440px screen empty (prod audit
    // 2026-08-01). From `lg` the card and the stats sit side by side instead, so the page fills
    // the width without stretching the form fields to an unreadable line length.
    <div className="mx-auto flex max-w-xl flex-col gap-6 lg:max-w-5xl">
      <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[30px]">
        {t('title')}
      </h1>

      {isLoading && <ProfileSkeleton />}

      {!isLoading && !user && (
        <div className="ww-card py-16 text-center text-[13px] text-[var(--ww-text-3)]">
          {t('notFound')}
        </div>
      )}

      {!isLoading && user && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          {/* Banner + karta bitta blok. Ilgari ular qo'shni edi va banner
              kartaning ikki chetidan chiqib turardi (prod audit). Endi banner —
              kartaning o'z sarlavha qatlami, chekkalar qurilishi bilan mos. */}
          <div className="relative">
            <div
              className="relative h-28 overflow-hidden rounded-t-[var(--ww-r-xl)] sm:h-32"
              style={{
                background:
                  'linear-gradient(135deg, var(--ww-accent) 0%, var(--ww-accent-lo) 45%, var(--ww-panel-solid) 100%)',
              }}
            >
              {/* Bannerni kartaga eritadi — quyida qattiq chok qolmasin */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-14"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, var(--ww-panel-solid) 100%)',
                }}
              />
            </div>

            <div className="relative -mt-12">
              <ProfileCard user={user} />
            </div>
          </div>

          {/* Mobilda karta ostida, desktopda o'ngdagi tor ustun */}
          <StatsGrid />
        </div>
      )}
    </div>
  );
}
