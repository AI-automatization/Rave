import { Request, Response, NextFunction } from 'express';
import { WatchPartyService } from '../services/watchParty.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class WatchPartyController {
  constructor(private watchPartyService: WatchPartyService) {}

  createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { movieId, maxMembers, isPrivate } = req.body as {
        movieId: string;
        maxMembers?: number;
        isPrivate?: boolean;
      };

      const room = await this.watchPartyService.createRoom(userId, movieId, maxMembers, isPrivate);
      res.status(201).json(apiResponse.success(room, 'Room created'));
    } catch (error) {
      next(error);
    }
  };

  joinRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { inviteCode } = req.params;

      const room = await this.watchPartyService.joinRoom(userId, inviteCode);
      res.json(apiResponse.success(room, 'Joined room'));
    } catch (error) {
      next(error);
    }
  };

  getRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await this.watchPartyService.getRoom(req.params.id);
      res.json(apiResponse.success(room));
    } catch (error) {
      next(error);
    }
  };

  leaveRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.watchPartyService.leaveRoom(userId, req.params.id);
      res.json(apiResponse.success(null, 'Left room'));
    } catch (error) {
      next(error);
    }
  };
}
