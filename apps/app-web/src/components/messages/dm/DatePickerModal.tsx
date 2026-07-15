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
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[320px] p-4 rounded-2xl gap-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-white">
            {tCal(MONTH_KEYS[viewMonth.getMonth()])} {viewMonth.getFullYear()}
          </span>
          <button
            onClick={goNextMonth}
            disabled={atCurrentMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label, i) => (
            <span key={i} className="text-[10px] text-center text-white/35 font-medium uppercase">{label}</span>
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
                disabled={isFuture}
                onClick={() => { onSelect(cell.date); onClose(); }}
                className={`aspect-square rounded-full flex items-center justify-center text-[13px] transition-colors cursor-pointer disabled:cursor-default ${
                  isToday
                    ? 'text-violet-300 font-bold ring-1 ring-violet-500/60'
                    : isFuture
                      ? 'text-white/15'
                      : isMarked
                        ? 'text-white hover:bg-white/[0.08]'
                        : 'text-white/30 hover:bg-white/[0.05]'
                }`}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-white/25 text-center">{t('jumpToDate')}</p>
      </DialogContent>
    </Dialog>
  );
}
