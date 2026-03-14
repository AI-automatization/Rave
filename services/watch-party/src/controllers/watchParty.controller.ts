import { Request, Response, NextFunction } from 'express';
import { Server as SocketServer } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest, VideoPlatform } from '@shared/types';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';

export class WatchPartyController {
  constructor(
    private watchPartyService: WatchPartyService,
    private io: SocketServer,
  ) {}

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
        videoPlatform?: VideoPlatform;
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

  // DELETE /watch-party/rooms/:id — close room (owner only), emit ROOM_CLOSED (T-S028)
  closeRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;
      await this.watchPartyService.closeRoom(userId, roomId);
      this.io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_closed' });
      res.json(apiResponse.success(null, 'Room closed'));
    } catch (error) {
      next(error);
    }
  };

  // POST /watch-party/rooms/:id/invite — send watch party invite notification to a friend
  inviteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;
      const { friendId, inviterName } = req.body as { friendId: string; inviterName?: string };

      if (!friendId) {
        res.status(400).json(apiResponse.error('friendId is required'));
        return;
      }

      const room = await this.watchPartyService.getRoom(roomId);
      if (!room) {
        res.status(404).json(apiResponse.error('Room not found'));
        return;
      }

      const roomTitle = room.name ?? room.videoTitle ?? 'Watch Party';
      const inviterDisplay = inviterName ?? 'Kimdir';

      // Non-blocking notification
      void sendInternalNotification({
        userId: friendId,
        type: 'watch_party_invite',
        title: 'Watch Party taklifi 🎬',
        body: `${inviterDisplay} sizni "${roomTitle}" ga taklif qildi`,
        data: {
          roomId: (room._id as object).toString(),
          inviteCode: room.inviteCode,
          inviterId: userId,
        },
      });

      res.json(apiResponse.success(null, 'Invite notification sent'));
    } catch (error) {
      next(error);
    }
  };
}
