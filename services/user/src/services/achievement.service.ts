import { Achievement, IAchievementDocument } from '../models/achievement.model';
import { UserAchievement } from '../models/userAchievement.model';
import { User } from '../models/user.model';
import { logger } from '@shared/utils/logger';
import { POINTS } from '@shared/constants';

// Achievement trigger hodisalari
export type AchievementEvent =
  | { type: 'movie_watched'; totalMovies: number; genre?: string }
  | { type: 'watch_party_joined'; totalJoined: number }
  | { type: 'watch_party_hosted'; totalHosted: number }
  | { type: 'battle_won'; totalWins: number }
  | { type: 'battle_participated'; totalBattles: number }
  | { type: 'friend_added'; totalFriends: number }
  | { type: 'review_written'; totalReviews: number }
  | { type: 'daily_streak'; currentStreak: number }
  | { type: 'rank_reached'; rank: string }
  | { type: 'watch_time'; hour: number }             // Watch Party da soat (0-23)
  | { type: 'daily_watch_minutes'; minutes: number };

interface UnlockResult {
  achievement: IAchievementDocument;
  pointsAwarded: number;
}

export class AchievementService {
  /**
   * Achievement triggerini tekshirish va unlock qilish.
   * @returns Yangi unlock bo'lgan achievementlar ro'yxati
   */
  async checkAndUnlock(userId: string, event: AchievementEvent): Promise<UnlockResult[]> {
    const candidates = await this.getCandidates(event);
    if (candidates.length === 0) return [];

    // Foydalanuvchining mavjud achievementlarini olish
    const alreadyUnlocked = await UserAchievement.find({ userId }).distinct('achievementKey');
    const alreadySet = new Set<string>(alreadyUnlocked);

    const newUnlocks: UnlockResult[] = [];

    for (const ach of candidates) {
      if (alreadySet.has(ach.key)) continue;
      if (!this.meetsCondition(ach, event)) continue;

      // Unlock
      await UserAchievement.create({
        userId,
        achievementId: ach._id.toString(),
        achievementKey: ach.key,
      });

      // Points award
      const pointsAwarded = ach.points + POINTS.ACHIEVEMENT_BASE;
      if (pointsAwarded > 0) {
        await User.updateOne({ authId: userId }, { $inc: { totalPoints: pointsAwarded } });
      }

      newUnlocks.push({ achievement: ach, pointsAwarded });
      logger.info('Achievement unlocked', { userId, achievementKey: ach.key, points: pointsAwarded });
    }

    return newUnlocks;
  }

  async getUserAchievements(userId: string, includeSecret = false): Promise<{
    unlocked: Array<{ achievement: IAchievementDocument; unlockedAt: Date }>;
    progress: Array<{ achievement: IAchievementDocument; isSecret: boolean }>;
  }> {
    const userAchievements = await UserAchievement.find({ userId }).sort({ unlockedAt: -1 });
    const unlockedKeys = new Set(userAchievements.map((ua) => ua.achievementKey));

    const allAchievements = await Achievement.find(
      includeSecret ? {} : { $or: [{ isSecret: false }, { key: { $in: [...unlockedKeys] } }] },
    ).sort({ rarity: 1, points: -1 });

    const unlocked: Array<{ achievement: IAchievementDocument; unlockedAt: Date }> = [];
    const locked: Array<{ achievement: IAchievementDocument; isSecret: boolean }> = [];

    for (const ach of allAchievements) {
      const ua = userAchievements.find((u) => u.achievementKey === ach.key);
      if (ua) {
        unlocked.push({ achievement: ach, unlockedAt: ua.unlockedAt });
      } else {
        locked.push({ achievement: ach, isSecret: ach.isSecret });
      }
    }

    return { unlocked, progress: locked };
  }

  async getAchievementStats(userId: string): Promise<{
    total: number;
    unlocked: number;
    totalPoints: number;
    byRarity: Record<string, number>;
  }> {
    const [total, userAchievements, allAchievements] = await Promise.all([
      Achievement.countDocuments({ isSecret: false }),
      UserAchievement.find({ userId }),
      Achievement.find({ key: { $in: (await UserAchievement.find({ userId })).map(u => u.achievementKey) } }),
    ]);

    const totalPoints = allAchievements.reduce((sum, a) => sum + a.points + POINTS.ACHIEVEMENT_BASE, 0);
    const byRarity = allAchievements.reduce<Record<string, number>>((acc, a) => {
      acc[a.rarity] = (acc[a.rarity] ?? 0) + 1;
      return acc;
    }, {});

    return { total, unlocked: userAchievements.length, totalPoints, byRarity };
  }

  // ─── Private helpers ────────────────────────────────────────

  private async getCandidates(event: AchievementEvent): Promise<IAchievementDocument[]> {
    return Achievement.find({ 'condition.type': event.type });
  }

  private meetsCondition(ach: IAchievementDocument, event: AchievementEvent): boolean {
    const cond = ach.condition as Record<string, unknown>;

    switch (event.type) {
      case 'movie_watched':
        return (cond.count as number) <= event.totalMovies;

      case 'watch_party_joined':
        return (cond.count as number) <= event.totalJoined;

      case 'watch_party_hosted':
        return (cond.count as number) <= event.totalHosted;

      case 'battle_won':
        return (cond.count as number) <= event.totalWins;

      case 'battle_participated':
        return (cond.count as number) <= event.totalBattles;

      case 'friend_added':
        return (cond.count as number) <= event.totalFriends;

      case 'review_written':
        return (cond.count as number) <= event.totalReviews;

      case 'daily_streak':
        return (cond.count as number) <= event.currentStreak;

      case 'rank_reached':
        return cond.rank === event.rank;

      case 'watch_time': {
        const hourMin = cond.hour_min as number;
        const hourMax = cond.hour_max as number;
        return event.hour >= hourMin && event.hour <= hourMax;
      }

      case 'daily_watch_minutes':
        return (cond.min as number) <= event.minutes;

      default:
        return false;
    }
  }
}
