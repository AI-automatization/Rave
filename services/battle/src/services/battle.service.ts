import Redis from 'ioredis';
import cron from 'node-cron';
import { Battle, IBattleDocument } from '../models/battle.model';
import { BattleParticipant } from '../models/battleParticipant.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS, POINTS } from '@shared/constants';
import { BattleDuration } from '@shared/types';

export class BattleService {
  constructor(private redis: Redis) {
    this.scheduleBattleResolution();
  }

  async createBattle(
    creatorId: string,
    title: string,
    duration: BattleDuration,
  ): Promise<IBattleDocument> {
    const battle = await Battle.create({
      title,
      creatorId,
      duration,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Add creator as first participant
    await BattleParticipant.create({
      battleId: battle._id.toString(),
      userId: creatorId,
      hasAccepted: true,
    });

    logger.info('Battle created', { battleId: battle._id, creatorId, duration });
    return battle;
  }

  async inviteParticipant(battleId: string, inviterId: string, inviteeId: string): Promise<void> {
    const battle = await Battle.findById(battleId);
    if (!battle) throw new NotFoundError('Battle not found');
    if (battle.status !== 'active' && battle.status !== 'pending') {
      throw new BadRequestError('Battle is not accepting participants');
    }

    const alreadyIn = await BattleParticipant.findOne({ battleId, userId: inviteeId });
    if (alreadyIn) throw new BadRequestError('User already in battle');

    const participantCount = await BattleParticipant.countDocuments({ battleId });
    if (participantCount >= 10) throw new BadRequestError('Battle is full');

    await BattleParticipant.create({ battleId, userId: inviteeId });
    logger.info('Battle invitation sent', { battleId, inviterId, inviteeId });
  }

  async acceptInvite(battleId: string, userId: string): Promise<void> {
    const participant = await BattleParticipant.findOne({ battleId, userId });
    if (!participant) throw new NotFoundError('Battle invitation not found');
    if (participant.hasAccepted) throw new BadRequestError('Already accepted');

    participant.hasAccepted = true;
    await participant.save();
    logger.info('Battle invite accepted', { battleId, userId });
  }

  async addMovieScore(
    battleId: string,
    userId: string,
    durationMinutes: number,
  ): Promise<void> {
    const battle = await Battle.findById(battleId);
    if (!battle || battle.status !== 'active') return;
    if (new Date() > battle.endDate) return;

    const scoreIncrement = Math.ceil(durationMinutes / 10) * POINTS.MOVIE_WATCHED;

    await BattleParticipant.updateOne(
      { battleId, userId },
      {
        $inc: {
          score: scoreIncrement,
          moviesWatched: 1,
          minutesWatched: durationMinutes,
        },
      },
    );

    // Update Redis sorted set
    const leaderboardKey = REDIS_KEYS.battleLeaderboard(battleId);
    await this.redis.zincrby(leaderboardKey, scoreIncrement, userId);
    await this.redis.expire(leaderboardKey, 7 * 24 * 60 * 60); // 7 days
  }

  async getLeaderboard(battleId: string): Promise<{ userId: string; score: number }[]> {
    const leaderboardKey = REDIS_KEYS.battleLeaderboard(battleId);
    const members = await this.redis.zrevrangebyscore(leaderboardKey, '+inf', '-inf', 'WITHSCORES');

    const leaderboard: { userId: string; score: number }[] = [];
    for (let i = 0; i < members.length; i += 2) {
      leaderboard.push({
        userId: members[i],
        score: parseFloat(members[i + 1]),
      });
    }

    return leaderboard;
  }

  async getBattle(battleId: string): Promise<IBattleDocument> {
    const battle = await Battle.findById(battleId);
    if (!battle) throw new NotFoundError('Battle not found');
    return battle;
  }

  async getUserActiveBattles(userId: string): Promise<IBattleDocument[]> {
    const participations = await BattleParticipant.find({
      userId,
      hasAccepted: true,
    }).select('battleId');

    const battleIds = participations.map((p) => p.battleId);
    return Battle.find({ _id: { $in: battleIds }, status: 'active' });
  }

  private scheduleBattleResolution(): void {
    // Run every hour to check ended battles
    cron.schedule('0 * * * *', async () => {
      try {
        const endedBattles = await Battle.find({
          status: 'active',
          endDate: { $lte: new Date() },
        });

        for (const battle of endedBattles) {
          await this.resolveBattle(battle._id.toString());
        }
      } catch (error) {
        logger.error('Battle resolution cron error', { error });
      }
    });

    logger.info('Battle resolution cron scheduled');
  }

  private async resolveBattle(battleId: string): Promise<void> {
    const leaderboard = await this.getLeaderboard(battleId);

    if (leaderboard.length === 0) {
      await Battle.updateOne({ _id: battleId }, { status: 'completed' });
      return;
    }

    const winnerId = leaderboard[0].userId;

    await Battle.updateOne(
      { _id: battleId },
      { status: 'completed', winnerId },
    );

    // Award winner points
    await BattleParticipant.updateOne(
      { battleId, userId: winnerId },
      { $inc: { score: POINTS.BATTLE_WIN } },
    );

    logger.info('Battle resolved', { battleId, winnerId });
  }
}
