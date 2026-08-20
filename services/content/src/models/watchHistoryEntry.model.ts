import { Schema, model, Document } from 'mongoose';

// Append-only log — one row per watch session (room-leave event), distinct from
// WatchProgress (watchProgress.model.ts), which is a single upserted "resume position" row
// per (userId, videoUrl) with no history semantics. This is what profile stats
// (totalWatched/totalMinutes/streaks) and the pricing page's "watch history retention"
// claim (Free 30 days / Pro unlimited — services/payment#getUserPlan) are computed from.
export interface IWatchHistoryEntryDocument extends Document {
  userId: string;
  movieId: string;
  videoUrl: string | null;
  durationWatchedSeconds: number;
  watchedAt: Date;
}

const watchHistoryEntrySchema = new Schema<IWatchHistoryEntryDocument>(
  {
    userId:                  { type: String, required: true },
    movieId:                 { type: String, required: true },
    videoUrl:                { type: String, default: null },
    durationWatchedSeconds:  { type: Number, default: 0 },
    watchedAt:               { type: Date, default: Date.now },
  },
  { timestamps: false },
);

watchHistoryEntrySchema.index({ userId: 1, watchedAt: -1 });

export const WatchHistoryEntry = model<IWatchHistoryEntryDocument>('WatchHistoryEntry', watchHistoryEntrySchema);
