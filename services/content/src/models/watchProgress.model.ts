import { Schema, Document } from 'mongoose';
import { getServiceConnection } from '@shared/utils/serviceConnection';

export interface IWatchProgressDocument extends Document {
  userId: string;
  videoUrl: string;
  currentTime: number;
  duration: number;
  percent: number;
  updatedAt: Date;
}

const watchProgressSchema = new Schema<IWatchProgressDocument>(
  {
    userId:      { type: String, required: true },
    videoUrl:    { type: String, required: true },
    currentTime: { type: Number, default: 0 },
    duration:    { type: Number, default: 0 },
    percent:     { type: Number, default: 0 },
  },
  { timestamps: true },
);

watchProgressSchema.index({ userId: 1, videoUrl: 1 }, { unique: true });
watchProgressSchema.index({ userId: 1, updatedAt: -1 });

export const WatchProgress = getServiceConnection('content').model<IWatchProgressDocument>('WatchProgress', watchProgressSchema);
