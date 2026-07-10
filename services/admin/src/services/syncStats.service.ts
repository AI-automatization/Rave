import { SyncStats, ITransportBreakdown } from '../models/syncStats.model';

export interface SyncStatsIngestPayload {
  roomId: string;
  userId?: string;
  isOwner: boolean;
  platform: string;
  appVersion: string;
  sessionStart: number;
  sessionEnd: number;
  transport: ITransportBreakdown;
  macroSeekCount: number;
  microAdjustCount: number;
  avgDriftMs: number;
  maxDriftMs: number;
  meshConnectFailed: boolean;
  syncErrors: string[];
}

const MS_DAY = 24 * 60 * 60 * 1000;

export class SyncStatsService {
  async ingest(payload: SyncStatsIngestPayload): Promise<void> {
    await SyncStats.create({
      roomId:            payload.roomId,
      userId:            payload.userId,
      isOwner:           payload.isOwner,
      platform:          payload.platform,
      appVersion:        payload.appVersion,
      sessionStart:      new Date(payload.sessionStart),
      sessionEnd:        new Date(payload.sessionEnd),
      durationMs:        Math.max(0, payload.sessionEnd - payload.sessionStart),
      transport:         payload.transport,
      macroSeekCount:    payload.macroSeekCount,
      microAdjustCount:  payload.microAdjustCount,
      avgDriftMs:        payload.avgDriftMs,
      maxDriftMs:        payload.maxDriftMs,
      meshConnectFailed: payload.meshConnectFailed,
      syncErrors:        payload.syncErrors,
    });
  }

  async getOverview(days: number = 7): Promise<unknown> {
    const since = new Date(Date.now() - days * MS_DAY);

    const [
      totalSessions,
      avgDriftResult,
      transportTotals,
      seekCounts,
      failedMeshCount,
      errorSessionsCount,
      dailyTrend,
    ] = await Promise.all([
      SyncStats.countDocuments({ createdAt: { $gte: since } }),

      SyncStats.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, avgDrift: { $avg: '$avgDriftMs' }, maxDrift: { $max: '$maxDriftMs' } } },
      ]),

      SyncStats.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            p2pMs:    { $sum: '$transport.p2pMs' },
            turnMs:   { $sum: '$transport.turnMs' },
            socketMs: { $sum: '$transport.socketMs' },
          },
        },
      ]),

      SyncStats.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            avgMacroSeeks:   { $avg: '$macroSeekCount' },
            avgMicroAdjusts: { $avg: '$microAdjustCount' },
          },
        },
      ]),

      SyncStats.countDocuments({ createdAt: { $gte: since }, meshConnectFailed: true }),

      SyncStats.countDocuments({ createdAt: { $gte: since }, syncErrors: { $exists: true, $not: { $size: 0 } } }),

      SyncStats.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sessions: { $sum: 1 },
            avgDrift: { $avg: '$avgDriftMs' },
          },
        },
        { $project: { date: '$_id', sessions: 1, avgDrift: 1, _id: 0 } },
        { $sort: { date: 1 } },
      ]),
    ]);

    const transport = transportTotals[0] ?? { p2pMs: 0, turnMs: 0, socketMs: 0 };
    const totalTransportMs = transport.p2pMs + transport.turnMs + transport.socketMs;
    const pct = (n: number): number => (totalTransportMs > 0 ? Math.round((n / totalTransportMs) * 100) : 0);

    return {
      totalSessions,
      avgDriftMs: Math.round(avgDriftResult[0]?.avgDrift ?? 0),
      maxDriftMs: Math.round(avgDriftResult[0]?.maxDrift ?? 0),
      transportBreakdown: {
        p2pPct:    pct(transport.p2pMs),
        turnPct:   pct(transport.turnMs),
        socketPct: pct(transport.socketMs),
      },
      avgMacroSeekCount:   Math.round((seekCounts[0]?.avgMacroSeeks ?? 0) * 10) / 10,
      avgMicroAdjustCount: Math.round((seekCounts[0]?.avgMicroAdjusts ?? 0) * 10) / 10,
      meshConnectFailedCount: failedMeshCount,
      errorSessionsCount,
      dailyTrend,
    };
  }

  async listRooms(
    page: number,
    limit: number,
    filters: { roomId?: string; hasErrors?: boolean } = {},
  ): Promise<{ rooms: unknown[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (filters.roomId) filter.roomId = filters.roomId;
    if (filters.hasErrors) filter.syncErrors = { $exists: true, $not: { $size: 0 } };

    const [rooms, total] = await Promise.all([
      SyncStats.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$roomId',
            participants: { $sum: 1 },
            avgDriftMs:   { $avg: '$avgDriftMs' },
            maxDriftMs:   { $max: '$maxDriftMs' },
            errorCount:   { $sum: { $size: '$syncErrors' } },
            meshConnectFailedCount: { $sum: { $cond: ['$meshConnectFailed', 1, 0] } },
            lastSessionAt: { $max: '$createdAt' },
          },
        },
        { $project: { roomId: '$_id', _id: 0, participants: 1, avgDriftMs: 1, maxDriftMs: 1, errorCount: 1, meshConnectFailedCount: 1, lastSessionAt: 1 } },
        { $sort: { lastSessionAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      SyncStats.distinct('roomId', filter).then((ids) => ids.length),
    ]);

    return { rooms, total };
  }

  async getRoomSessions(roomId: string): Promise<unknown[]> {
    return SyncStats.find({ roomId }).sort({ createdAt: -1 }).lean();
  }
}
