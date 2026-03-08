import { Request, Response, NextFunction } from 'express';
import { WatchPartyService } from '../services/watchParty.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class WatchPartyController {
  constructor(private watchPartyService: WatchPartyService) {}

  createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const {
        name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform,
        maxMembers, isPrivate, password, startTime,
      } = req.body as {
        name?: string;
        movieId?: string;
        videoUrl?: string;
        videoTitle?: string;
        videoThumbnail?: string;
        videoPlatform?: string;
        maxMembers?: number;
        isPrivate?: boolean;
        password?: string;
        startTime?: number;
      };

      const room = await this.watchPartyService.createRoom(userId, {
        name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform,
        maxMembers, isPrivate, password, startTime,
      });
      res.status(201).json(apiResponse.success(room, 'Room created'));
    } catch (error) {
      next(error);
    }
  };

  joinRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { inviteCode } = req.params;
      const { password } = req.body as { password?: string };

      const room = await this.watchPartyService.joinRoom(userId, inviteCode, password);
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

  getRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) ?? '50', 10), 100);
      const rooms = await this.watchPartyService.getRooms(limit);
      res.json(apiResponse.success(rooms));
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
