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

  if ((payload.watchPartyDuration ?? 0) > 0) score += 15;
  if ((payload.watchPartyDuration ?? 0) > 60000) score += 10;

  const hasRegister = payload.events.some((e) => e.event === 'action:register');
  if (hasRegister) score += 10;

  return Math.min(score, 100);
}

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
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSessions,
      todaySessions,
      avgDuration,
      platformBreakdown,
      topScreens,
      topExitScreens,
      newVsReturning,
      avgEngagement,
      dailyActivity,
    ] = await Promise.all([
      AnalyticsSession.countDocuments({ startTime: { $gte: since } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: today } }),

      AnalyticsSession.aggregate([
        { $match: { startTime: { $gte: since }, duration: { $exists: true, $gt: 0 } } },
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
    ]);

    const newUsers     = newVsReturning.find((r: { _id: boolean }) => r._id === true)?.count ?? 0;
    const returning    = newVsReturning.find((r: { _id: boolean }) => r._id === false)?.count ?? 0;

    return {
      totalSessions,
      todaySessions,
      avgSessionDuration: Math.round((avgDuration[0]?.avg ?? 0) / 1000),
      avgEngagementScore: Math.round(avgEngagement[0]?.avg ?? 0),
      platformBreakdown,
      topScreens,
      topExitScreens,
      newVsReturning: { new: newUsers, returning },
      dailyActivity,
    };
  }

  async getFunnel(days: number = 7): Promise<unknown> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalOpen,
      reachedHome,
      openedRoom,
      watchedParty,
      completedWatch,
    ] = await Promise.all([
      AnalyticsSession.countDocuments({ startTime: { $gte: since } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, 'screens.screen': 'Home' }),
      AnalyticsEvent.countDocuments({ ts: { $gte: since }, event: { $in: ['action:room_join', 'action:room_create'] } }).then(
        () => AnalyticsSession.countDocuments({ startTime: { $gte: since }, 'screens.screen': { $in: ['WatchRoom', 'WatchParty', 'Room'] } }),
      ),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, watchPartyDuration: { $gt: 0 } }),
      AnalyticsSession.countDocuments({ startTime: { $gte: since }, watchPartyDuration: { $gt: 60000 } }),
    ]);

    const registrationEvents = await AnalyticsEvent.countDocuments({
      ts: { $gte: since },
      event: 'action:register',
    });

    return [
      { step: 'Открыли приложение', count: totalOpen, pct: 100 },
      { step: 'Дошли до главной',    count: reachedHome, pct: totalOpen ? Math.round((reachedHome / totalOpen) * 100) : 0 },
      { step: 'Зарегистрировались', count: registrationEvents, pct: totalOpen ? Math.round((registrationEvents / totalOpen) * 100) : 0 },
      { step: 'Открыли комнату',     count: openedRoom, pct: totalOpen ? Math.round((openedRoom / totalOpen) * 100) : 0 },
      { step: 'Начали смотреть',    count: watchedParty, pct: totalOpen ? Math.round((watchedParty / totalOpen) * 100) : 0 },
      { step: 'Смотрели > 1 мин',   count: completedWatch, pct: totalOpen ? Math.round((completedWatch / totalOpen) * 100) : 0 },
    ];
  }

  async listSessions(page: number, limit: number, userId?: string): Promise<unknown> {
    const filter = userId ? { userId } : {};
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
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Sessions by how many screens they visited before leaving
    const depthDistribution = await AnalyticsSession.aggregate([
      { $match: { startTime: { $gte: since } } },
      { $project: { depth: { $size: '$screens' }, exitContext: 1, exitScreen: 1 } },
      {
        $bucket: {
          groupBy: '$depth',
          boundaries: [0, 1, 2, 3, 5, 10, 20],
          default: '20+',
          output: { count: { $sum: 1 } },
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
      duration:  { $lt: 10000 },
    });

    return { depthDistribution, exitContexts, shortSessions };
  }
}
