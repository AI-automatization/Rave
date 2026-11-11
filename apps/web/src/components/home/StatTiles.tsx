'use client';

/**
 * Geymifikatsiya plitalari — daraja, seriya, ball.
 *
 * Barcha qiymatlar `useUserStats()` → `/api/user/me/stats` dan keladi
 * (`hooks/use-profile.ts` dagi `UserStats`). Hech qanday qiymat to'qib
 * chiqarilmaydi: ma'lumot kelmasa blok butunlay render qilinmaydi.
 *
 * Dizayn qarori: har plita O'Z rangida "cho'miladi" — juda past alfali rang
 * yuvindisi + rangli chegara + yuqorida rangli chiziq. Birinchi variantda
 * hammasi bir xil kulrang edi (`--ww-surface-1`, 2.4% oq) va sahifa
 * wireframe'dek ko'rinardi. Rang — soya emas: u qorong'i fonni iflos
 * qilmaydi, aksincha ma'no qo'shadi.
 *
 * Raqamlar Oswald (`--font-display`) bilan va KATTA. Geymifikatsiyada
 * ko'rsatkichning o'zi qahramon; 19px matn buni bermaydi.
 */

import { useTranslations } from 'next-intl';
import { Flame, Star, Zap } from 'lucide-react';
import { useUserStats } from '@/hooks/use-profile';

function Tile({
  label,
  color,
  soft,
  icon: Icon,
  className,
  children,
  footer,
}: {
  label: string;
  color: string;
  soft: string;
  icon: React.ElementType;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[var(--ww-r-lg)] p-4 sm:p-5 ${className ?? ''}`}
      style={{
        background: `linear-gradient(160deg, ${soft} 0%, rgba(255,255,255,0.02) 62%)`,
        border: '1px solid var(--ww-line)',
      }}
    >
      {/* Yuqoridagi rangli chiziq — plitani bir qarashda ajratadi */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 70%)` }}
      />

      <div className="flex items-center gap-2">
        <Icon size={14} aria-hidden="true" style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ww-text-3)]">
          {label}
        </span>
      </div>

      <div className="mt-3">{children}</div>
      {footer && <div className="mt-2.5">{footer}</div>}
    </div>
  );
}

/**
 * Katta ko'rsatkich. Raqam va so'z bir xil o'lchamda bo'la olmaydi: raqam
 * qisqa ("7", "12 480"), daraja nomi esa uzun so'z ("Kinoman", "Новичок",
 * "Legenda") va mobil yarim ustunda 34px da plitadan toshib chiqadi.
 */
function Value({
  children,
  color,
  variant = 'number',
}: {
  children: React.ReactNode;
  color?: string;
  variant?: 'number' | 'text';
}) {
  const size =
    variant === 'number'
      ? 'text-[34px] sm:text-[40px]'
      : 'text-[20px] sm:text-[28px] lg:text-[32px] truncate';

  return (
    <p
      className={`font-[family-name:var(--font-display)] font-medium uppercase leading-[1.02] tracking-[0.01em] ${size}`}
      style={{ color: color ?? 'var(--ww-text)' }}
    >
      {children}
    </p>
  );
}

export function StatTiles() {
  const t = useTranslations('home');
  const { data: stats } = useUserStats();

  // Ma'lumot yo'q — bo'sh plita ko'rsatilmaydi. "0 ball, daraja yo'q" degan
  // ekran yangi foydalanuvchini rag'batlantirmaydi, faqat joy egallaydi.
  if (!stats) return null;

  const progress = Math.max(0, Math.min(100, Math.round(stats.rankProgress ?? 0)));

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {/* Daraja */}
      <Tile
        label={t('statLevel')}
        color="var(--ww-accent-hi)"
        soft="rgba(124,58,237,0.16)"
        icon={Zap}
        footer={
          <div className="flex flex-col gap-1.5">
            <div
              className="ww-meter"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('levelProgress', { percent: progress })}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11.5px] text-[var(--ww-text-4)]">
              {t('levelProgress', { percent: progress })}
            </p>
          </div>
        }
      >
        <Value variant="text">{stats.rank || '—'}</Value>
      </Tile>

      {/* Seriya */}
      <Tile
        label={t('statStreak')}
        color="var(--ww-streak)"
        soft="rgba(255,138,61,0.14)"
        icon={Flame}
        footer={
          <p className="text-[11.5px] text-[var(--ww-text-4)]">
            {t('streakBest', { count: stats.longestStreak ?? 0 })}
          </p>
        }
      >
        {/* Raqam katta, birlik yonida kichik. Ilgari "7" va ostida "7 kun"
            yozilib, bir xil son ikki marta takrorlanardi. */}
        <div className="flex items-baseline gap-2">
          <Value color="var(--ww-streak)">{stats.currentStreak ?? 0}</Value>
          <span className="text-[13px] font-medium text-[var(--ww-text-3)]">
            {t('streakUnit')}
          </span>
        </div>
      </Tile>

      {/* Ball — mobil ikki ustunli to'rda uchinchi plita yolg'iz va yarim
          bo'sh qolardi, o'sha yerda ikkala ustunni egallaydi */}
      <Tile
        label={t('statPoints')}
        color="var(--ww-gold)"
        soft="rgba(245,197,66,0.13)"
        icon={Star}
        className="col-span-2 lg:col-span-1"
        footer={
          <p className="text-[11.5px] text-[var(--ww-text-4)]">
            {t('statWatched')}: {stats.totalWatched ?? 0}
          </p>
        }
      >
        <Value color="var(--ww-gold)">{(stats.totalPoints ?? 0).toLocaleString()}</Value>
      </Tile>
    </div>
  );
}
