/**
 * WW v2 — inline xabar bloki (xato / ogohlantirish / muvaffaqiyat).
 *
 * Nega kerak: login, register, forgot, reset, settings — hammasida
 * `bg-red-500/[0.07] border-red-500/[0.15] rounded-xl` qo'lda yozilgan,
 * har birida shaffoflik biroz boshqacha. Bu toast EMAS — toast vaqtinchalik
 * va formadan ajralgan; Notice esa forma ichida, kontekst yonida turadi.
 */

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type NoticeVariant = 'danger' | 'warning' | 'success' | 'info';

const VARIANTS: Record<NoticeVariant, { icon: React.ElementType; wrap: string; fg: string }> = {
  danger: {
    icon: XCircle,
    wrap: 'bg-[var(--ww-danger-soft)] border-[var(--ww-danger-line)]',
    fg: 'text-[var(--ww-danger)]',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'bg-amber-400/[0.08] border-amber-400/25',
    fg: 'text-amber-300',
  },
  success: {
    icon: CheckCircle2,
    wrap: 'bg-emerald-400/[0.08] border-emerald-400/25',
    fg: 'text-[var(--ww-success)]',
  },
  info: {
    icon: Info,
    wrap: 'bg-[var(--ww-accent-soft)] border-[rgba(124,58,237,0.28)]',
    fg: 'text-[var(--ww-accent-hi)]',
  },
};

export interface NoticeProps {
  variant?: NoticeVariant;
  /** Qalin sarlavha. Yo'q bo'lsa — bir qatorli xabar ko'rinishi */
  title?: React.ReactNode;
  /** Sukut bo'yicha ikonkani almashtirish */
  icon?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
}

export function Notice({ variant = 'danger', title, icon, children, className }: NoticeProps) {
  const v = VARIANTS[variant];
  const Icon = icon ?? v.icon;

  return (
    <div
      /* xato — darhol e'lon qilinadi; qolganlari navbat bilan */
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-[var(--ww-r-md)] border px-3.5 py-3',
        v.wrap,
        className,
      )}
    >
      <Icon size={16} aria-hidden="true" className={cn('mt-px shrink-0', v.fg)} />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className={cn('text-[13.5px] font-semibold leading-snug', v.fg)}>{title}</p>}
        {children && (
          <div
            className={cn(
              'text-[13px] leading-relaxed',
              title ? 'text-[var(--ww-text-2)]' : v.fg,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
