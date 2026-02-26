import { Schema, model, Document } from 'mongoose';

export interface IWatchHistoryDocument extends Document {
  userId: string;
  movieId: string;
  watchedAt: Date;
  progress: number; // 0-100 percentage
  completed: boolean;
  durationWatched: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

const watchHistorySchema = new Schema<IWatchHistoryDocument>(
  {
    userId: { type: String, required: true, index: true },
    movieId: { type: String, required: true },
    watchedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    durationWatched: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  },
);

watchHistorySchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, watchedAt: -1 });

export const WatchHistory = model<IWatchHistoryDocument>('WatchHistory', watchHistorySchema);
