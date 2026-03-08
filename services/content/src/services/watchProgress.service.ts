import { WatchProgress } from '../models/watchProgress.model';

export const watchProgressService = {
  async save(userId: string, videoUrl: string, currentTime: number, duration: number) {
    const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    await WatchProgress.findOneAndUpdate(
      { userId, videoUrl },
      { currentTime, duration, percent },
      { upsert: true, new: true },
    );
  },

  async get(userId: string, videoUrl: string) {
    return WatchProgress.findOne({ userId, videoUrl });
  },

  async getBatch(userId: string, videoUrls: string[]) {
    const results = await WatchProgress.find({ userId, videoUrl: { $in: videoUrls } });
    return Object.fromEntries(results.map((r) => [r.videoUrl, { currentTime: r.currentTime, duration: r.duration, percent: r.percent }]));
  },
};
