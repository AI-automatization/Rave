import { Schema, model, Document } from 'mongoose';

export interface IScreenVisit {
  screen: string;
  enteredAt: Date;
  exitedAt?: Date;
  duration?: number;
}

export interface IAnalyticsSessionDocument extends Document {
  sessionId: string;
  userId?: string;
  platform: string;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  isNewUser: boolean;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  screens: IScreenVisit[];
  exitScreen?: string;
  exitContext?: string;
  watchPartyDuration: number;
  engagementScore: number;
  eventsCount: number;
  isActive: boolean;
}

const screenVisitSchema = new Schema<IScreenVisit>(
  {
    screen:    { type: String, required: true },
    enteredAt: { type: Date, required: true },
    exitedAt:  { type: Date },
    duration:  { type: Number },
  },
  { _id: false },
);

const schema = new Schema<IAnalyticsSessionDocument>(
  {
    sessionId:          { type: String, required: true, unique: true },
    userId:             { type: String, index: true },
    platform:           { type: String, default: 'unknown' },
    appVersion:         { type: String, default: '' },
    deviceModel:        { type: String, default: '' },
    osVersion:          { type: String, default: '' },
    isNewUser:          { type: Boolean, default: false },
    startTime:          { type: Date, required: true, index: true },
    endTime:            { type: Date },
    duration:           { type: Number },
    screens:            { type: [screenVisitSchema], default: [] },
    exitScreen:         { type: String },
    exitContext:        { type: String },
    watchPartyDuration: { type: Number, default: 0 },
    engagementScore:    { type: Number, default: 0 },
    eventsCount:        { type: Number, default: 0 },
    isActive:           { type: Boolean, default: true, index: true },
  },
  {
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ startTime: -1 });
schema.index({ userId: 1, startTime: -1 });
schema.index({ platform: 1 });
schema.index({ exitScreen: 1 });
// Keep sessions for 90 days
schema.index({ startTime: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AnalyticsSession = model<IAnalyticsSessionDocument>('AnalyticsSession', schema);
