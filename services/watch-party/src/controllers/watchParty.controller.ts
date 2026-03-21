import { Request, Response, NextFunction } from 'express';
import { Server as SocketServer } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { AuthenticatedRequest, VideoPlatform } from '@shared/types';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';

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
          screen: 'WatchParty',
        },
      });

      res.json(apiResponse.success(null, 'Invite notification sent'));
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
        WatchPartyRoom.countDocuments({ createdAt: { $gte: today } }),
        WatchPartyRoom.countDocuments({ status: { $in: ['playing', 'waiting', 'paused'] } }),
      ]);
      res.json(apiResponse.success({ createdToday, activeNow }));
    } catch (error) {
      next(error);
    }
  };

  adminListRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const status = req.query.status as string | undefined;

      const query: Record<string, unknown> = {};
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [rooms, total] = await Promise.all([
        WatchPartyRoom.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        WatchPartyRoom.countDocuments(query),
      ]);

      res.json(apiResponse.paginated(rooms, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  adminCloseRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await WatchPartyRoom.findById(req.params.id);
      if (!room) {
        res.status(404).json(apiResponse.error('Room not found'));
        return;
      }

      room.status = 'ended';
      await room.save();

      this.io.to(req.params.id).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'admin_closed' });

      res.json(apiResponse.success(null, 'Room closed'));
    } catch (error) {
      next(error);
    }
  };

  // POST /internal/admin/:id/join — admin joins any room (bypasses all restrictions)
  adminJoinRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.id;
      const room = await WatchPartyRoom.findById(roomId).lean();
      if (!room) {
        res.status(404).json(apiResponse.error('Room not found'));
        return;
      }

      // Emit admin:joined to all room members
      this.io.to(roomId).emit('admin:joined', { message: 'Admin is monitoring this room' });

      res.json(apiResponse.success({ room }, 'Admin joined watch party'));
    } catch (error) {
      next(error);
    }
  };

  // POST /internal/admin/:id/control — admin controls video in any room
  adminControlRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.id;
      const { action, currentTime } = req.body as { action: 'play' | 'pause' | 'seek'; currentTime?: number };

      const room = await WatchPartyRoom.findById(roomId);
      if (!room) {
        res.status(404).json(apiResponse.error('Room not found'));
        return;
      }

      const time = currentTime ?? room.currentTime;

      if (action === 'play') {
        room.isPlaying = true;
        room.currentTime = time;
        await room.save();
        this.io.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, { userId: 'admin', currentTime: time });
      } else if (action === 'pause') {
        room.isPlaying = false;
        room.currentTime = time;
        await room.save();
        this.io.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, { userId: 'admin', currentTime: time });
      } else if (action === 'seek') {
        room.currentTime = time;
        await room.save();
        this.io.to(roomId).emit(SERVER_EVENTS.VIDEO_SEEK, { userId: 'admin', currentTime: time });
      }

      res.json(apiResponse.success(null, `Admin ${action} executed`));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /internal/admin/:id/members/:userId — admin kicks any member
  adminKickMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: roomId, userId: targetUserId } = req.params;

      const room = await WatchPartyRoom.findById(roomId);
      if (!room) {
        res.status(404).json(apiResponse.error('Room not found'));
        return;
      }

      room.members = room.members.filter((m) => m !== targetUserId);
      await room.save();

      // Emit kick event to the room so all clients know
      this.io.to(roomId).emit(SERVER_EVENTS.MEMBER_KICKED, { userId: targetUserId });
      // Also emit directly to the kicked user's socket (if they're in the room)
      this.io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'admin_kicked', targetUserId });

      res.json(apiResponse.success(null, 'Member kicked'));
    } catch (error) {
      next(error);
    }
  };

  // POST /internal/users/:userId/disconnect — force-disconnect blocked user from all socket rooms
  disconnectUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      // Find all sockets in the user's personal room and disconnect them
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      for (const s of sockets) {
        s.emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'account_blocked' });
        s.disconnect(true);
      }
      res.json(apiResponse.success(null, `Disconnected ${sockets.length} socket(s) for user`));
    } catch (error) {
      next(error);
    }
  };
}
