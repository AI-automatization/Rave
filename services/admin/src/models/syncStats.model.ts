import { Schema, model, Document } from 'mongoose';

// Per-room-session sync-quality telemetry — sent once when a member leaves a watch-party room.
// Separate from AnalyticsSession (general app-usage/engagement) because this is a distinct
// concern: how well did playback stay in sync, not what screens the user visited.
export interface ITransportBreakdown {
  p2pMs: number;
  turnMs: number;
  socketMs: number;
}

export interface ISyncStatsDocument extends Document {
  roomId: string;
  userId?: string;
  isOwner: boolean;
  platform: string;
  appVersion: string;
  sessionStart: Date;
  sessionEnd: Date;
  durationMs: number;
  transport: ITransportBreakdown;
  macroSeekCount: number;
  microAdjustCount: number;
  avgDriftMs: number;
  maxDriftMs: number;
  meshConnectFailed: boolean;
  syncErrors: string[];
  createdAt: Date;
}

const transportSchema = new Schema<ITransportBreakdown>(
  {
    p2pMs:    { type: Number, default: 0 },
    turnMs:   { type: Number, default: 0 },
    socketMs: { type: Number, default: 0 },
  },
  { _id: false },
);

const schema = new Schema<ISyncStatsDocument>(
  {
    roomId:            { type: String, required: true, index: true },
    userId:            { type: String, index: true },
    isOwner:           { type: Boolean, default: false },
    platform:          { type: String, default: 'unknown' },
    appVersion:        { type: String, default: '' },
    sessionStart:      { type: Date, required: true },
    sessionEnd:        { type: Date, required: true },
    durationMs:        { type: Number, default: 0 },
    transport:         { type: transportSchema, default: () => ({ p2pMs: 0, turnMs: 0, socketMs: 0 }) },
    macroSeekCount:    { type: Number, default: 0 },
    microAdjustCount:  { type: Number, default: 0 },
    avgDriftMs:        { type: Number, default: 0 },
    maxDriftMs:        { type: Number, default: 0 },
    meshConnectFailed: { type: Boolean, default: false },
    syncErrors:        { type: [String], default: [] },
    createdAt:         { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ createdAt: -1 });
schema.index({ roomId: 1, createdAt: -1 });
// Keep sync-stats for 30 days — this is a debugging/observability tool, not long-term analytics.
schema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const SyncStats = model<ISyncStatsDocument>('SyncStats', schema);
