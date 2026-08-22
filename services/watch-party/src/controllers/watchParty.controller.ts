import { Request, Response, NextFunction } from 'express';
import { Server as SocketServer } from 'socket.io';
import Redis from 'ioredis';
import { WatchPartyService } from '../services/watchParty.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { AuthenticatedRequest, VideoPlatform } from '@shared/types';
import { sendInternalNotification, getUserPlan } from '@shared/utils/serviceClient';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { getAppSetting } from '@shared/utils/appSettings';
import { ForbiddenError, NotFoundError } from '@shared/utils/errors';
import { startVBForRoom } from '../socket/vbSession.helper';
import { enqueueVBRequest } from '../socket/vbQueue.helper';
import { isOfficialEmbedHost, isOwnVbUrl } from '../services/extractionClient';

export class WatchPartyController {
  constructor(
    private watchPartyService: WatchPartyService,
    private io: SocketServer,
    private redis: Redis,
  ) {}

  createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const watchPartiesEnabled = await getAppSetting<boolean>('watchPartiesEnabled');
      if (!watchPartiesEnabled) {
        throw new ForbiddenError('Watch Parties are temporarily disabled');
      }

      const { userId } = (req as AuthenticatedRequest).user;

      // One active room per owner — a user can only host a single room at a time.
      // If they already own a non-ended room, return it (409) so the client reopens
      // the existing room instead of silently creating duplicates.
      const existingRoom = await WatchPartyRoom.findOne({
        ownerId: userId,
        status: { $ne: 'ended' },
      }).select('_id').lean();
      if (existingRoom) {
        res.status(409).json({
          success: false,
          data: { roomId: String(existingRoom._id) },
          message: 'ROOM_ALREADY_EXISTS',
          errors: null,
        });
        return;
      }

      const {
        name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform,
        maxMembers, isPrivate, password, startTime, videoReferer,
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
        videoReferer?: string;
      };

      const room = await this.watchPartyService.createRoom(userId, {
        name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform,
        maxMembers, isPrivate, password, startTime, videoReferer,
      });
      res.status(201).json(apiResponse.success(room, 'Room created'));

      // Real prod bug 2026-08-10 (uzmovi.net): createRoom used to just store videoUrl as-is —
      // no extraction, no VB, nothing. The only fix was a fragile client-side workaround
      // (app-web's CreateRoomDialog appended ?verify=1, RoomContent re-submitted the same URL
      // through CHANGE_MEDIA once the socket connected) that mobile never had at all. VB is now
      // the sole extraction mechanism (Saidazim's call, 2026-08-10) — start it here, server-side,
      // right at creation, same as CHANGE_MEDIA does. Fired after the response for the same
      // reason as playNextFromPlaylist below: launching Chromium takes seconds, room creation
      // should not hang on it. Official-embed hosts (YouTube/VK/Rutube/...) are skipped — they
      // already play instantly client-side via their own iframe.
      if (videoUrl && !isOfficialEmbedHost(videoUrl) && !isOwnVbUrl(videoUrl)) {
        const roomId = String(room._id);
        void (async () => {
          const tier = await getUserPlan(userId);
          try {
            await startVBForRoom(this.io, this.redis, roomId, userId, videoUrl, tier);
          } catch (e) {
            if ((e as Error).message === 'virtual_browser_limit') {
              enqueueVBRequest({ roomId, ownerId: userId, url: videoUrl, io: this.io, redis: this.redis });
              logger.info('createRoom: VB queued — free pool full', { roomId, userId });
              return;
            }
            logger.warn('createRoom: VB auto-start failed', { roomId, url: videoUrl, error: (e as Error).message });
          }
        })();
      }
    } catch (error) {
      // Handled here rather than by the shared error middleware because the client needs the
      // existing room's id to navigate to it, and that middleware only forwards code/reason —
      // teaching it about roomId would mean changing shared/* for a single endpoint.
      const err = error as Error & { code?: string; roomId?: string };
      if (err.code === 'ROOM_ALREADY_EXISTS' && err.roomId) {
        // Shape is deliberately redundant. Mobile builds already in the field read
        // `message === 'ROOM_ALREADY_EXISTS'` + `data.roomId` (useCreateWatchParty.ts), and those
        // installs cannot be updated together with the server — if the response only carried the
        // newer `code`/`roomId` fields they would show "could not create room" instead of
        // reopening the existing one. New clients read `code`/`roomId`.
        res.status(409).json({
          success: false,
          data: { roomId: err.roomId },
          code: 'ROOM_ALREADY_EXISTS',
          roomId: err.roomId,
          message: 'ROOM_ALREADY_EXISTS',
          errors: null,
        });
        return;
      }
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
      // Private rooms were fully readable by any authenticated user who had the room ID —
      // verifyToken only checks "logged in", not "belongs to this room". Membership/ownership
      // is required for a private room; 404 (not 403) so a non-member can't even confirm the
      // room exists — same reasoning as the join flow already uses for a bad invite code.
      const { userId } = (req as AuthenticatedRequest).user;
      if (room.isPrivate && room.ownerId !== userId && !room.members.includes(userId)) {
        throw new NotFoundError('Room not found');
      }
      res.json(apiResponse.success(room));
    } catch (error) {
      next(error);
    }
  };

  getRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '50', 10) || 20), 100);
      const rooms = await this.watchPartyService.getRooms(limit);
      res.json(apiResponse.success(rooms));
    } catch (error) {
      next(error);
    }
  };

  leaveRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;
      const { newOwnerId } = req.body as { newOwnerId?: string };
      const result = await this.watchPartyService.leaveRoom(userId, roomId, newOwnerId);

      if (result.closed) {
        this.io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
      } else if (result.newOwnerId) {
        this.io.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
        this.io.to(roomId).emit(SERVER_EVENTS.OWNER_TRANSFERRED, { newOwnerId: result.newOwnerId });
      } else {
        this.io.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
      }

      res.json(apiResponse.success(result, 'Left room'));
    } catch (error) {
      next(error);
    }
  };

  // ── T-S060: Playlist ──────────────────────────────────────────

  // POST /watch-party/rooms/:id/playlist
  addToPlaylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;
      const { videoUrl, videoTitle, videoPlatform } = req.body as {
        videoUrl: string;
        videoTitle?: string;
        videoPlatform?: VideoPlatform;
      };

      if (!videoUrl) {
        res.status(400).json(apiResponse.error('videoUrl is required'));
        return;
      }

      const room = await this.watchPartyService.addToPlaylist(userId, roomId, { videoUrl, videoTitle, videoPlatform });
      this.io.to(roomId).emit(SERVER_EVENTS.PLAYLIST_UPDATED, { playlist: room.playlist });
      res.status(201).json(apiResponse.success({ playlist: room.playlist }, 'Added to playlist'));

      // T-S173 — resolve the link in the background, AFTER responding. Extraction plus a headless
      // browser probe can take tens of seconds; making the owner wait for it would turn "add to
      // queue" into a long spinner for something they don't need an answer to yet.
      const queued = room.playlist[room.playlist.length - 1];
      if (queued) {
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
        void this.watchPartyService
          .preResolvePlaylistItem(roomId, queued.videoUrl, queued.addedAt, token)
          .then(async () => {
            // Re-read rather than patching the in-memory copy: other items' probes may have
            // landed in the meantime, and the panel should show all of their statuses.
            const fresh = await this.watchPartyService.getRoom(roomId).catch(() => null);
            if (fresh) this.io.to(roomId).emit(SERVER_EVENTS.PLAYLIST_UPDATED, { playlist: fresh.playlist });
          })
          .catch(() => { /* preResolvePlaylistItem never throws; this is belt-and-braces */ });
      }
    } catch (error) {
      next(error);
    }
  };

  // DELETE /watch-party/rooms/:id/playlist/:index
  removeFromPlaylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;
      const index = parseInt(req.params.index, 10);

      if (isNaN(index) || index < 0) {
        res.status(400).json(apiResponse.error('Invalid index'));
        return;
      }

      const room = await this.watchPartyService.removeFromPlaylist(userId, roomId, index);
      this.io.to(roomId).emit(SERVER_EVENTS.PLAYLIST_UPDATED, { playlist: room.playlist });
      res.json(apiResponse.success({ playlist: room.playlist }, 'Removed from playlist'));
    } catch (error) {
      next(error);
    }
  };

  // POST /watch-party/rooms/:id/playlist/next
  playNextFromPlaylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const roomId = req.params.id;

      const room = await this.watchPartyService.playNextFromPlaylist(userId, roomId);
      this.io.to(roomId).emit(SERVER_EVENTS.PLAYLIST_UPDATED, { playlist: room.playlist });
      this.io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, room);
      res.json(apiResponse.success({
        videoUrl:      room.videoUrl,
        videoTitle:    room.videoTitle,
        videoPlatform: room.videoPlatform,
        playlist:      room.playlist,
      }, 'Advanced to next video'));

      // T-S175 — the pre-resolve (T-S173) already established this link needs a real browser, so
      // start one instead of leaving the room on a URL that cannot play. Fired after the response
      // for the same reason as the pre-resolve above: launching Chromium takes seconds and the
      // owner's "Next" should not hang on it. CHANGE_MEDIA has always had this fallback;
      // advancing the queue did not, which is the gap this closes.
      if (room.videoUrl && (room as { nextNeedsVirtualBrowser?: boolean }).nextNeedsVirtualBrowser) {
        const videoUrl = room.videoUrl;
        void (async () => {
          const tier = await getUserPlan(userId);
          try {
            await startVBForRoom(this.io, this.redis, roomId, userId, videoUrl, tier);
          } catch (e) {
            if ((e as Error).message === 'virtual_browser_limit') {
              enqueueVBRequest({ roomId, ownerId: userId, url: videoUrl, io: this.io, redis: this.redis });
              logger.info('playNext: VB queued — free pool full', { roomId, userId });
              return;
            }
            logger.warn('playNext: VB fallback failed to start', { roomId, url: videoUrl, error: (e as Error).message });
          }
        })();
      }
    } catch (error) {
      next(error);
    }
  };

  // ── T-S061: Recent rooms ──────────────────────────────────────

  // GET /watch-party/rooms/my/recent
  getRecentRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '10', 10) || 10), 20);
      const rooms = await this.watchPartyService.getRecentRooms(userId, limit);
      res.json(apiResponse.success(rooms));
    } catch (error) {
      next(error);
    }
  };

  // ── 2026-08-22: Pro "continue watching" ───────────────────────────────

  // GET /watch-party/rooms/my/resumable
  getResumableRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const rooms = await this.watchPartyService.listResumableRooms(userId);
      res.json(apiResponse.success(rooms));
    } catch (error) {
      next(error);
    }
  };

  // POST /watch-party/rooms/:id/resume
  resumeRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const room = await this.watchPartyService.resumeRoom(userId, req.params.id);
      res.status(201).json(apiResponse.success(room, 'Room resumed'));
    } catch (error) {
      next(error);
    }
  };

  // ── T-S062: Public active rooms ───────────────────────────────

  // GET /watch-party/rooms/public/active
  getPublicActiveRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '50', 10) || 50), 100);
      const rooms = await this.watchPartyService.getPublicActiveRooms(limit);
      res.json(apiResponse.success(rooms));
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
      this.io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
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

  adminGetRoomDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await WatchPartyRoom.findById(req.params.id).lean();
      if (!room) { res.status(404).json(apiResponse.error('Room not found')); return; }
      res.json(apiResponse.success(room));
    } catch (error) { next(error); }
  };

  adminListRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
      const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20), 100);
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

      const { adminEmail, closeReason } = req.body as { adminEmail?: string; closeReason?: string };

      this.io.to(req.params.id).emit(SERVER_EVENTS.ROOM_CLOSED, {
        reason: 'admin_closed',
        adminEmail: adminEmail ?? 'admin',
        closeReason: closeReason ?? '',
      });

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

  // POST /internal/dm/:userId/notify — broadcast a DM message to userId's open chat in
  // realtime. Called by services/user for EVERY new message regardless of how it was
  // created (in-app socket send, or a REST call e.g. from a notification-reply) — a single
  // source of truth so the receiver's open chat updates live either way.
  notifyDmMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      this.io.to(`user:${userId}`).emit(SERVER_EVENTS.DM_MESSAGE, req.body);
      res.json(apiResponse.success(null, 'Notified'));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /internal/users/:userId — cascade account deletion (GDPR/App Store compliance)
  // Deletes: rooms owned by user, removes user from member arrays of other rooms
  deleteUserData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      // Close (mark ended) all rooms owned by this user and disconnect their members
      const ownedRooms = await WatchPartyRoom.find({ ownerId: userId, status: { $ne: 'ended' } });
      for (const room of ownedRooms) {
        this.io.to(room.id).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
      }

      await Promise.all([
        // Delete all rooms created by this user
        WatchPartyRoom.deleteMany({ ownerId: userId }),
        // Remove this userId from members arrays in rooms they joined
        WatchPartyRoom.updateMany(
          { members: userId },
          { $pull: { members: userId } },
        ),
      ]);

      logger.info('WatchPartyService: deleted user data', { userId });
      res.json(apiResponse.success(null, 'User watch party data deleted'));
    } catch (error) {
      next(error);
    }
  };
}
