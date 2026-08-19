import { WatchHistoryEntry } from '../models/watchHistoryEntry.model';
import { getUserPlan } from '@shared/utils/serviceClient';

const FREE_RETENTION_DAYS = 30;

async function retentionCutoff(userId: string): Promise<Date> {
  const plan = await getUserPlan(userId);
  if (plan === 'pro') return new Date(0);
  return new Date(Date.now() - FREE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export const watchHistoryService = {
  async record(userId: string, movieId: string, durationWatchedSeconds: number, videoUrl: string | null): Promise<void> {
    await WatchHistoryEntry.create({ userId, movieId, durationWatchedSeconds, videoUrl });
  },

  async getStats(userId: string): Promise<{
    totalWatched: number; totalMinutes: number; currentStreak: number; longestStreak: number; weeklyActivity: number[];
  }> {
    const cutoff = await retentionCutoff(userId);
    const entries = await WatchHistoryEntry.find({ userId, watchedAt: { $gte: cutoff } })
      .select('movieId durationWatchedSeconds watchedAt')
      .lean();

    const totalWatched = new Set(entries.map((e) => e.movieId)).size;
    const totalMinutes = Math.round(entries.reduce((sum, e) => sum + e.durationWatchedSeconds, 0) / 60);

    // Distinct calendar dates (local server TZ — good enough for a streak counter) the user
    // watched anything, sorted ascending, used for both the 7-day activity bars and the
    // streak walk below.
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const minutesByDay = new Map<string, number>();
    for (const e of entries) {
      const key = dayKey(e.watchedAt);
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + e.durationWatchedSeconds / 60);
    }

    const weeklyActivity: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      weeklyActivity.push(Math.round(minutesByDay.get(dayKey(d)) ?? 0));
    }

    const watchedDays = [...minutesByDay.keys()].sort();
    let longestStreak = 0;
    let running = 0;
    let prevDay: string | null = null;
    for (const day of watchedDays) {
      if (prevDay) {
        const gapMs = new Date(day).getTime() - new Date(prevDay).getTime();
        running = gapMs === 24 * 60 * 60 * 1000 ? running + 1 : 1;
      } else {
        running = 1;
      }
      longestStreak = Math.max(longestStreak, running);
      prevDay = day;
    }

    // Current streak only counts if it reaches today or yesterday — otherwise it's over.
    const todayKey = dayKey(new Date());
    const yesterdayKey = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const currentStreak = (prevDay === todayKey || prevDay === yesterdayKey) ? running : 0;

    return { totalWatched, totalMinutes, currentStreak, longestStreak, weeklyActivity };
  },
};
