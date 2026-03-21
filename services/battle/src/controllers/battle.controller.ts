import { Request, Response, NextFunction } from 'express';
import { BattleService } from '../services/battle.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { Battle } from '../models/battle.model';
import { BattleParticipant } from '../models/battleParticipant.model';

export class BattleController {
  constructor(private battleService: BattleService) {}

  createBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { title, duration } = req.body as { title: string; duration: 3 | 5 | 7 };
      const battle = await this.battleService.createBattle(userId, title, duration);
      res.status(201).json(apiResponse.success(battle, 'Battle created'));
    } catch (error) {
      next(error);
    }
  };

  getBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const battle = await this.battleService.getBattle(req.params.id);
      res.json(apiResponse.success(battle));
    } catch (error) {
      next(error);
    }
  };

  inviteParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { id: battleId } = req.params;
      const { inviteeId } = req.body as { inviteeId: string };
      await this.battleService.inviteParticipant(battleId, userId, inviteeId);
      res.json(apiResponse.success(null, 'Invitation sent'));
    } catch (error) {
      next(error);
    }
  };

  acceptInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.battleService.acceptInvite(req.params.id, userId);
      res.json(apiResponse.success(null, 'Battle joined'));
    } catch (error) {
      next(error);
    }
  };

  // POST /battles/:id/reject (T-S029)
  rejectInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { creatorId } = await this.battleService.rejectInvite(req.params.id, userId);
      // Non-blocking notification to challenger
      void sendInternalNotification({
        userId: creatorId,
        type: 'battle_result',
        title: 'Battle rad etildi',
        body: 'Siz yuborgan battle taklifi rad etildi',
        data: { battleId: req.params.id },
      });
      res.json(apiResponse.success(null, 'Battle rejected'));
    } catch (error) {
      next(error);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leaderboard = await this.battleService.getLeaderboard(req.params.id);
      res.json(apiResponse.success(leaderboard));
    } catch (error) {
      next(error);
    }
  };

  getMyBattles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const battles = await this.battleService.getUserActiveBattles(userId);
      res.json(apiResponse.success(battles));
    } catch (error) {
      next(error);
    }
  };

  getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.battleService.getUserStats(req.params.userId);
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  // ── Admin endpoints ──────────────────────────────────────────

  adminGetStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [createdToday, activeNow] = await Promise.all([
        Battle.countDocuments({ createdAt: { $gte: today } }),
        Battle.countDocuments({ status: 'active' }),
      ]);
      res.json(apiResponse.success({ createdToday, activeNow }));
    } catch (error) {
      next(error);
    }
  };

  adminListBattles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const status = req.query.status as string | undefined;

      const query: Record<string, unknown> = {};
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [battles, total] = await Promise.all([
        Battle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Battle.countDocuments(query),
      ]);

      // Join participants for each battle
      const battleIds = battles.map((b) => String(b._id));
      const participants = await BattleParticipant.find({ battleId: { $in: battleIds } }).lean();
      const byBattle: Record<string, typeof participants> = {};
      for (const p of participants) {
        if (!byBattle[p.battleId]) byBattle[p.battleId] = [];
        byBattle[p.battleId].push(p);
      }

      const result = battles.map((b) => ({ ...b, participants: byBattle[String(b._id)] ?? [] }));

      res.json(apiResponse.paginated(result, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  adminEndBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const battle = await Battle.findById(req.params.id);
      if (!battle) {
        res.status(404).json(apiResponse.error('Battle not found'));
        return;
      }

      battle.status = 'completed';
      battle.endDate = new Date();
      await battle.save();

      res.json(apiResponse.success(null, 'Battle ended'));
    } catch (error) {
      next(error);
    }
  };

  adminCancelBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const battle = await Battle.findById(req.params.id);
      if (!battle) {
        res.status(404).json(apiResponse.error('Battle not found'));
        return;
      }
      if (battle.status !== 'pending') {
        res.status(400).json(apiResponse.error('Only pending battles can be cancelled'));
        return;
      }
      battle.status = 'cancelled';
      await battle.save();
      res.json(apiResponse.success(null, 'Battle cancelled'));
    } catch (error) {
      next(error);
    }
  };
}
