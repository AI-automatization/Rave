import { Request, Response, NextFunction } from 'express';
import { BattleService } from '../services/battle.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

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
}
