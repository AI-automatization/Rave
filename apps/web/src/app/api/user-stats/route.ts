import { type NextRequest, NextResponse } from 'next/server';

const USER_BASE    = process.env.USER_SERVICE_URL    ?? 'https://user-production-86ed.up.railway.app/api/v1';
const CONTENT_BASE = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  if (!auth) {
    return NextResponse.json({ success: false, data: null, message: 'Unauthorized' }, { status: 401 });
  }

  const headers = { 'Content-Type': 'application/json', Authorization: auth };

  try {
    // Fetch user profile + watch history + achievements in parallel
    const [profileRes, historyRes, achievementsRes] = await Promise.allSettled([
      fetch(`${USER_BASE}/users/me`, { headers }),
      fetch(`${CONTENT_BASE}/content/history?limit=1000`, { headers }),
      fetch(`${USER_BASE}/achievements/me`, { headers }),
    ]);

    // ── User profile ──────────────────────────────────
    type UserProfile = { rank?: string; totalPoints?: number };
    let profile: UserProfile = {};
    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      const j = await profileRes.value.json() as { data?: UserProfile };
      profile = j.data ?? {};
    }

    // ── Watch history ─────────────────────────────────
    type HistoryItem = { durationWatched?: number; completed?: boolean };
    let history: HistoryItem[] = [];
    if (historyRes.status === 'fulfilled' && historyRes.value.ok) {
      const j = await historyRes.value.json() as { data?: HistoryItem[] | { items?: HistoryItem[] } };
      if (Array.isArray(j.data)) {
        history = j.data;
      } else if (j.data && 'items' in j.data && Array.isArray(j.data.items)) {
        history = j.data.items;
      }
    }

    const moviesWatched = history.length;
    const secondsWatched = history.reduce((s, h) => s + (h.durationWatched ?? 0), 0);
    const minutesWatched = Math.round(secondsWatched / 60);

    // ── Achievements ──────────────────────────────────
    type AchievementItem = { unlockedAt?: string | null };
    let achievementsList: AchievementItem[] = [];
    if (achievementsRes.status === 'fulfilled' && achievementsRes.value.ok) {
      const j = await achievementsRes.value.json() as { data?: AchievementItem[] };
      if (Array.isArray(j.data)) achievementsList = j.data;
    }
    const achievements = achievementsList.filter((a) => !!a.unlockedAt).length;

    const stats = {
      moviesWatched,
      minutesWatched,
      watchParties:      0,
      battlesWon:        0,
      battlesTotal:      0,
      achievements,
      totalPoints:       profile.totalPoints ?? 0,
      rank:              profile.rank ?? 'bronze',
      genreDistribution: [],
    };

    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json({ success: false, data: null, message: 'Failed to load stats' }, { status: 500 });
  }
}
