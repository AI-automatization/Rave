'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { dateKeyFromDate, MONTH_KEYS } from '@/lib/dm/dm-date-groups';
import { useLocaleStore } from '@/store/locale.store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  markedDateKeys: Set<string>;
  initialDate?: Date | null;
}

type DayCell = { date: Date; key: string } | null;

// Custom dark month-grid calendar (Monday-first, like Telegram's jump-to-date) — port of
// mobile's DatePickerModal.tsx. Days present in `markedDateKeys` render normally; days without
// messages are dimmed; future days are extra-dim and disabled (no navigating ahead of today).
export function DatePickerModal({ open, onClose, onSelect, markedDateKeys, initialDate }: Props) {
  const t = useTranslations('dm');
  const tCal = useTranslations('calendar');
  const locale = useLocaleStore((s) => s.locale);
  const [viewMonth, setViewMonth] = useState(() => initialDate ?? new Date());

  // Re-anchor to initialDate (or today) every time the modal opens — mirrors mobile.
  useEffect(() => {
    if (open) setViewMonth(initialDate ?? new Date());
  }, [open, initialDate]);

  const today = new Date();
  const todayKey = dateKeyFromDate(today);
  const atCurrentMonth =
    viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();

  const weekdayLabels = useMemo(() => {
    // Monday-first short weekday names via Intl, localized to the app's active locale — avoids
    // needing 7 more hardcoded translation keys across 3 locale files just for this grid header.
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2024-01-01 is a Monday — a stable local anchor to enumerate Mon..Sun from.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const grid = useMemo<DayCell[]>(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon..6=Sun

    const cells: DayCell[] = Array.from({ length: firstWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      cells.push({ date, key: dateKeyFromDate(date) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  function goPrevMonth() {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goNextMonth() {
    if (atCurrentMonth) return;
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[320px] gap-3 rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-4 text-[var(--ww-text)]">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label={t('prevMonth')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="text-[14px] font-semibold text-[var(--ww-text)]">
            {tCal(MONTH_KEYS[viewMonth.getMonth()])} {viewMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            disabled={atCurrentMonth}
            aria-label={t('nextMonth')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)] disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label, i) => (
            <span key={i} className="text-center text-[10px] font-medium uppercase text-[var(--ww-text-4)]">
              {label}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.key === todayKey;
            const isFuture = cell.key > todayKey;
            const isMarked = markedDateKeys.has(cell.key);

            return (
              <button
                key={i}
                type="button"
                disabled={isFuture}
                onClick={() => { onSelect(cell.date); onClose(); }}
                className={`flex aspect-square cursor-pointer items-center justify-center rounded-full text-[13px] tabular-nums transition-colors disabled:cursor-default ${
                  isToday
                    ? 'font-semibold text-[var(--ww-accent-hi)] ring-1 ring-[rgba(124,58,237,0.6)]'
                    : isFuture
                      ? 'text-[var(--ww-text-4)] opacity-50'
                      : isMarked
                        ? 'text-[var(--ww-text)] hover:bg-[var(--ww-surface-2)]'
                        : 'text-[var(--ww-text-4)] hover:bg-[var(--ww-surface-1)]'
                }`}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-[var(--ww-text-4)]">{t('jumpToDate')}</p>
      </DialogContent>
    </Dialog>
  );
}
