// Web DM chat date grouping (Telegram-style inline "Today"/"Yesterday"/date separators +
// jump-to-date support). Ported verbatim from apps/mobile/src/utils/dmDateGroups.ts (T-S122) —
// plain functions, no date library, kept translator-agnostic (caller injects `t`, no next-intl
// import here) so this stays a pure, framework-free module like its mobile counterpart.
import type { DmMessage } from '@/lib/api/user.api';

type Translate = (section: 'dm' | 'calendar', key: string) => string;

export type DMListItem =
  | { kind: 'date'; id: string; dateKey: string; label: string }
  | { kind: 'message'; id: string; dateKey: string; label: string; message: DmMessage };

export const MONTH_KEYS = [
  'monthJan', 'monthFeb', 'monthMar', 'monthApr', 'monthMay', 'monthJun',
  'monthJul', 'monthAug', 'monthSep', 'monthOct', 'monthNov', 'monthDec',
] as const;

/** Local-calendar-day key (YYYY-MM-DD), NOT UTC — grouping must match what the user sees on screen. */
export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDayLabel(iso: string, t: Translate): string {
  const day = startOfLocalDay(iso);
  const today = startOfLocalDay(new Date().toISOString());
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return t('dm', 'today');
  if (diffDays === 1) return t('dm', 'yesterday');
  const month = t('calendar', MONTH_KEYS[day.getMonth()]);
  const sameYear = day.getFullYear() === today.getFullYear();
  return sameYear ? `${day.getDate()} ${month}` : `${day.getDate()} ${month} ${day.getFullYear()}`;
}

/** Flattens messages into a render-ready list, inserting one date separator per new calendar day. */
export function buildDMList(messages: DmMessage[], t: Translate): DMListItem[] {
  const out: DMListItem[] = [];
  let lastKey: string | null = null;
  for (const m of messages) {
    const key = dateKeyFromDate(new Date(m.createdAt));
    if (key !== lastKey) {
      out.push({ kind: 'date', id: `date-${key}`, dateKey: key, label: formatDayLabel(m.createdAt, t) });
      lastKey = key;
    }
    out.push({ kind: 'message', id: m._id, dateKey: key, label: formatDayLabel(m.createdAt, t), message: m });
  }
  return out;
}

/**
 * Index of the first item on-or-after the target day (its date separator, if that day has
 * messages). Falls back to the last item when nothing exists on/after the target — mirrors
 * Telegram's "jump to date" landing on the nearest real message instead of failing.
 */
export function findJumpIndex(listData: DMListItem[], targetKey: string): number {
  for (let i = 0; i < listData.length; i++) {
    if (listData[i].dateKey >= targetKey) return i;
  }
  return Math.max(0, listData.length - 1);
}
