import { AnalyticsSession } from '../models/analyticsSession.model';
import { AnalyticsEvent } from '../models/analyticsEvent.model';

export interface IngestPayload {
  sessionId: string;
  userId?: string;
  platform: string;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  isNewUser: boolean;
  events: Array<{
    event: string;
    screen?: string;
    ts: number;
    meta?: Record<string, unknown>;
  }>;
  screens: Array<{
    screen: string;
    enteredAt: number;
    exitedAt?: number;
    duration?: number;
  }>;
  sessionStart: number;
  sessionEnd?: number;
  exitScreen?: string;
  exitContext?: string;
  watchPartyDuration?: number;
  isActive: boolean;
}

function calcEngagementScore(payload: IngestPayload): number {
  let score = 0;
  const duration = payload.sessionEnd
    ? (payload.sessionEnd - payload.sessionStart) / 1000
    : 0;

  if (duration > 30)  score += 15;
  if (duration > 120) score += 15;
  if (duration > 300) score += 10;

  const uniqueScreens = new Set(payload.screens.map((s) => s.screen)).size;
  score += Math.min(uniqueScreens * 5, 25);

  if ((payload.watchPartyDuration ?? 0) > 0)      score += 15;
  if ((payload.watchPartyDuration ?? 0) > 60_000) score += 10;

  const hasRegister = payload.events.some((e) => e.event === 'action:register');
  if (hasRegister) score += 10;

  return Math.min(score, 100);
}

const MS_DAY = 24 * 60 * 60 * 1000;

export class AnalyticsService {
  async ingest(payload: IngestPayload): Promise<void> {
    const sessionStart = new Date(payload.sessionStart);
    const sessionEnd   = payload.sessionEnd ? new Date(payload.sessionEnd) : undefined;
    const duration     = payload.sessionEnd ? payload.sessionEnd - payload.sessionStart : undefined;

    const screens = payload.screens.map((s) => ({
      screen:    s.screen,
      enteredAt: new Date(s.enteredAt),
      exitedAt:  s.exitedAt ? new Date(s.exitedAt) : undefined,
      duration:  s.duration,
    }));

    const engagementScore = calcEngagementScore(payload);

    await AnalyticsSession.findOneAndUpdate(
      { sessionId: payload.sessionId },
      {
        $set: {
          userId:             payload.userId,
          platform:           payload.platform,
          appVersion:         payload.appVersion,
          deviceModel:        payload.deviceModel,
          osVersion:          payload.osVersion,
          isNewUser:          payload.isNewUser,
          startTime:          sessionStart,
          endTime:            sessionEnd,
          duration,
          screens,
          exitScreen:         payload.exitScreen,
          exitContext:        payload.exitContext,
          watchPartyDuration: payload.watchPartyDuration ?? 0,
          engagementScore,
          eventsCount:        payload.events.length,
          isActive:           payload.isActive,
        },
      },
      { upsert: true, new: true },
    );

    if (payload.events.length > 0) {
      const docs = payload.events.map((e) => ({
        sessionId: payload.sessionId,
        userId:    payload.userId,
        event:     e.event,
        screen:    e.screen,
        ts:        new Date(e.ts),
        meta:      e.meta,
        platform:  payload.platform,
      }));
      await AnalyticsEvent.insertMany(docs, { ordered: false }).catch(() => undefined);
    }
  }

  async getOverview(days: number = 7): Promise<unknown> {
    const now   = Date.now();
    const since = new Date(now - days * MS_DAY);
    const prevSince = new Date(now - 2 * days * MS_DAY);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSessions,
      prevTotalSessions,
      todaySessions,
      activeNow,
      avgDurationResult,
      prevAvgDurationResult,
      platformBreakdown,
      topScreens,
      topExitScreens,
      newVsReturning,
      avgEngagementResult,
      prevAvgEngagementResult,
      dailyActivity,
      versionBreakdown,
    ] = await Promise.all([
      AnalyticsSession.countDocuments({ startTime: { $gte: since } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: prevSince, $lt: since } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: today } }),

      // Active in last 30 min
      AnalyticsSession.countDocuments({
        isActive:  true,
        startTime: { $gte: new Date(now - 30 * 60 * 1000) },
      }),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since }, duration: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]),
      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: prevSince, $lt: since }, duration: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since } } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since } } },
        { $unwind: '$screens' },
        { $group: { _id: '$screens.screen', visits: { $sum: 1 }, avgDuration: { $avg: '$screens.duration' } } },
        { $sort: { visits: -1 } },
        { $limit: 10 },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since }, exitScreen: { $exists: true, $ne: null } } },
        { $group: { _id: '$exitScreen', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since } } },
        { $group: { _id: '$isNewUser', count: { $sum: 1 } } },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since } } },
        { $group: { _id: null, avg: { $avg: '$engagementScore' } } },
      ]),
      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: prevSince, $lt: since } } },
        { $group: { _id: null, avg: { $avg: '$engagementScore' } } },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            sessions: { $sum: 1 },
            users: { $addToSet: '$userId' },
          },
        },
        { $project: { date: '$_id', sessions: 1, uniqueUsers: { $size: '$users' }, _id: 0 } },
        { $sort: { date: 1 } },
      ]),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since }, appVersion: { $exists: true, $ne: '' } } },
        { $group: { _id: '$appVersion', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const currentAvgDuration  = avgDurationResult[0]?.avg ?? 0;
    const prevAvgDuration     = prevAvgDurationResult[0]?.avg ?? 0;
    const currentEngagement   = avgEngagementResult[0]?.avg ?? 0;
    const prevEngagement      = prevAvgEngagementResult[0]?.avg ?? 0;

    const delta = (curr: number, prev: number): number | null => {
      if (!prev) return null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const newUsers  = (newVsReturning as Array<{ _id: boolean; count: number }>).find((r) => r._id === true)?.count ?? 0;
    const returning = (newVsReturning as Array<{ _id: boolean; count: number }>).find((r) => r._id === false)?.count ?? 0;

    return {
      totalSessions,
      todaySessions,
      activeNow,
      avgSessionDuration:  Math.round(currentAvgDuration / 1000),
      avgEngagementScore:  Math.round(currentEngagement),
      platformBreakdown,
      topScreens,
      topExitScreens,
      newVsReturning: { new: newUsers, returning },
      dailyActivity,
      versionBreakdown,
      prevPeriodDelta: {
        sessions:   delta(totalSessions, prevTotalSessions),
        duration:   delta(currentAvgDuration, prevAvgDuration),
        engagement: delta(currentEngagement, prevEngagement),
      },
    };
  }

  async getFunnel(days: number = 7): Promise<unknown> {
    const since = new Date(Date.now() - days * MS_DAY);

    const [
      totalOpen,
      reachedHome,
      openedRoom,
      watchedParty,
      completedWatch,
      registrationEvents,
      loginEvents,
    ] = await Promise.all([
      AnalyticsSession.countDocuments({ startTime: { $gte: since } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, 'screens.screen': 'Home' }),
      AnalyticsSession.countDocuments({
        startTime: { $gte: since },
        'screens.screen': { $in: ['WatchRoom', 'WatchParty', 'Room'] },
      }),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, watchPartyDuration: { $gt: 0 } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, watchPartyDuration: { $gt: 60_000 } }),
      AnalyticsEvent.countDocuments({ ts: { $gte: since }, event: 'action:register' }),
      AnalyticsEvent.countDocuments({ ts: { $gte: since }, event: 'action:login' }),
    ]);

    const pct = (n: number): number => totalOpen ? Math.round((n / totalOpen) * 100) : 0;

    return [
      { step: 'Открыли приложение',  count: totalOpen,          pct: 100 },
      { step: 'Дошли до главной',    count: reachedHome,        pct: pct(reachedHome) },
      { step: 'Вошли / вернулись',   count: loginEvents,        pct: pct(loginEvents) },
      { step: 'Зарегистрировались',  count: registrationEvents, pct: pct(registrationEvents) },
      { step: 'Открыли комнату',     count: openedRoom,         pct: pct(openedRoom) },
      { step: 'Начали смотреть',     count: watchedParty,       pct: pct(watchedParty) },
      { step: 'Смотрели > 1 мин',   count: completedWatch,     pct: pct(completedWatch) },
    ];
  }

  async listSessions(
    page: number,
    limit: number,
    filters: {
      userId?: string;
      platform?: string;
      isNewUser?: boolean;
      exitContext?: string;
    } = {},
  ): Promise<{ sessions: unknown[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (filters.userId)   filter.userId = filters.userId;
    if (filters.platform) filter.platform = filters.platform;
    if (filters.exitContext) filter.exitContext = filters.exitContext;
    if (filters.isNewUser !== undefined) filter.isNewUser = filters.isNewUser;

    const [sessions, total] = await Promise.all([
      AnalyticsSession.find(filter)
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AnalyticsSession.countDocuments(filter),
    ]);
    return { sessions, total };
  }

  async getSession(sessionId: string): Promise<unknown> {
    const [session, events] = await Promise.all([
      AnalyticsSession.findOne({ sessionId }).lean(),
      AnalyticsEvent.find({ sessionId }).sort({ ts: 1 }).lean(),
    ]);
    return { session, events };
  }

  async getDropOff(days: number = 7): Promise<unknown> {
    const since = new Date(Date.now() - days * MS_DAY);

    const depthDistribution = await AnalyticsSession.aggregate([
      { $match: { startTime: { $gte: since } } },
      { $project: { depth: { $size: '$screens' }, exitContext: 1, exitScreen: 1 } },
      {
        $bucket: {
          groupBy:    '$depth',
          boundaries: [0, 1, 2, 3, 5, 10, 20],
          default:    '20+',
          output:     { count: { $sum: 1 } },
        },
      },
    ]);

    const exitContexts = await AnalyticsSession.aggregate([
      { $match: { startTime: { $gte: since }, exitContext: { $exists: true, $ne: null } } },
      { $group: { _id: '$exitContext', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const shortSessions = await AnalyticsSession.countDocuments({
      startTime: { $gte: since },
      duration:  { $lt: 10_000 },
    });

    return { depthDistribution, exitContexts, shortSessions };
  }

  async getRetention(): Promise<unknown> {
    // Find all users who have ever had a new-user session, get their first session date
    const firstSessions = await AnalyticsSession.aggregate([
      { $match: { userId: { $exists: true, $nin: [null, ''] }, isNewUser: true } },
      { $group: { _id: '$userId', firstSeen: { $min: '$startTime' } } },
    ]);

    if (!firstSessions.length) {
      return { d1: 0, d7: 0, d30: 0, cohortSize: 0 };
    }

    const userIds = firstSessions.map((u: { _id: string }) => u._id);

    // Get first return session (non-new-user) for each user
    const returnSessions = await AnalyticsSession.aggregate([
      { $match: { userId: { $in: userIds }, isNewUser: false } },
      { $group: { _id: '$userId', firstReturn: { $min: '$startTime' } } },
    ]);

    const firstSessionMap = new Map<string, Date>(
      firstSessions.map((u: { _id: string; firstSeen: Date }) => [u._id, u.firstSeen]),
    );
    const returnMap = new Map<string, Date>(
      returnSessions.map((u: { _id: string; firstReturn: Date }) => [u._id, u.firstReturn]),
    );

    const now = Date.now();
    let d1Total = 0, d1Retained = 0;
    let d7Total = 0, d7Retained = 0;
    let d30Total = 0, d30Retained = 0;

    for (const [uid, firstSeen] of firstSessionMap) {
      const firstTs   = firstSeen.getTime();
      const returnTs  = returnMap.get(uid)?.getTime();
      const deltaDays = returnTs ? (returnTs - firstTs) / MS_DAY : Infinity;

      // Only count in cohort if enough time has passed to measure that window
      if (now - firstTs >= 1 * MS_DAY) {
        d1Total++;
        if (deltaDays <= 1) d1Retained++;
      }
      if (now - firstTs >= 7 * MS_DAY) {
        d7Total++;
        if (deltaDays <= 7) d7Retained++;
      }
      if (now - firstTs >= 30 * MS_DAY) {
        d30Total++;
        if (deltaDays <= 30) d30Retained++;
      }
    }

    return {
      d1:  d1Total  > 0 ? Math.round((d1Retained  / d1Total)  * 100) : null,
      d7:  d7Total  > 0 ? Math.round((d7Retained  / d7Total)  * 100) : null,
      d30: d30Total > 0 ? Math.round((d30Retained / d30Total) * 100) : null,
      cohortSize: firstSessions.length,
    };
  }
}
