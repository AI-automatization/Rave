// WeWatch Mobile — Telegram-style "jump to date" calendar for DM chat.
// Custom month grid (no native picker, no new deps) so it matches the app's dark theme
// instead of the OS-default date picker look.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { TrackedPressable } from '@components/common/TrackedPressable';
import { useT } from '@i18n/index';
import { dateKeyFromDate, MONTH_KEYS } from '@utils/dmDateGroups';

const WEEKDAY_KEYS = [
  'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun',
] as const;

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon..6=Sun (CIS-style week start)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  markedDateKeys: Set<string>;
  /** Month to open on — the date currently visible in the chat, falls back to today. */
  initialDate?: Date | null;
}

export function DatePickerModal({ visible, onClose, onSelect, markedDateKeys, initialDate }: Props) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [viewYear, setViewYear] = useState(() => (initialDate ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (initialDate ?? new Date()).getMonth());

  // Re-anchor to the caller's "current" date every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    const d = initialDate ?? new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [visible, initialDate]);

  const now = new Date();
  const todayKey = dateKeyFromDate(now);
  const rows = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const atCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (atCurrentMonth) return; // no jumping into the future
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TrackedPressable trackId="dm:date_picker_backdrop_close" style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={s.handle} />

          <View style={s.monthRow}>
            <TrackedTouchable trackId="dm_calendar:prev_month" onPress={goPrevMonth} style={s.navBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TrackedTouchable>
            <Text style={s.monthLabel}>
              {t('calendar', MONTH_KEYS[viewMonth])} {viewYear}
            </Text>
            <TrackedTouchable
              trackId="dm_calendar:next_month"
              onPress={goNextMonth}
              style={s.navBtn}
              hitSlop={8}
              disabled={atCurrentMonth}
            >
              <Ionicons name="chevron-forward" size={20} color={atCurrentMonth ? 'rgba(255,255,255,0.15)' : '#fff'} />
            </TrackedTouchable>
          </View>

          <View style={s.weekdayRow}>
            {WEEKDAY_KEYS.map(k => (
              <Text key={k} style={s.weekdayLabel}>{t('calendar', k)}</Text>
            ))}
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={s.dayRow}>
              {row.map((date, di) => {
                if (!date) return <View key={di} style={s.dayCell} />;
                const key = dateKeyFromDate(date);
                const isFuture = key > todayKey;
                const isToday = key === todayKey;
                const hasMessages = markedDateKeys.has(key);
                return (
                  <TrackedTouchable
                    trackId="dm_calendar:select_day"
                    key={di}
                    style={s.dayCell}
                    disabled={isFuture}
                    activeOpacity={0.6}
                    onPress={() => onSelect(date)}
                  >
                    <View style={[s.dayCircle, isToday && s.dayCircleToday]}>
                      <Text style={[
                        s.dayText,
                        !hasMessages && s.dayTextDim,
                        isFuture && s.dayTextFuture,
                        isToday && s.dayTextToday,
                      ]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </TrackedTouchable>
                );
              })}
            </View>
          ))}
        </Pressable>
      </TrackedPressable>
    </Modal>
  );
}

const CELL = 40;

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#16162a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: CELL,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: '#7B72F8',
  },
  dayText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#fff',
  },
  dayTextDim: {
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '400',
  },
  dayTextFuture: {
    color: 'rgba(255,255,255,0.12)',
  },
  dayTextToday: {
    color: '#9C93FF',
  },
});
