import { Router } from 'express';
import Redis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import { WatchPartyController } from '../controllers/watchParty.controller';
import { WatchPartyService } from '../services/watchParty.service';
import { verifyToken, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { createRoomLimiter, joinRoomLimiter } from '../middleware/rateLimiter';

export const createWatchPartyRouter = (redis: Redis, io: SocketServer): Router => {
  const router = Router();
  const watchPartyService = new WatchPartyService(redis);
  const watchPartyController = new WatchPartyController(watchPartyService, io);
  const notBlocked = requireNotBlocked(redis);
  const createLimiter = createRoomLimiter(redis);
  const joinLimiter = joinRoomLimiter(redis);

  // Internal — force-disconnect blocked user from all sockets
  router.post('/internal/users/:userId/disconnect', requireInternalSecret, watchPartyController.disconnectUser);

  // Internal Admin: GET /watch-party/internal/admin/stats — today's stats (admin)
  router.get('/internal/admin/stats', requireInternalSecret, watchPartyController.adminGetStats);

  // Internal Admin: GET /watch-party/internal/admin/list — list all rooms (admin)
  router.get('/internal/admin/list', requireInternalSecret, watchPartyController.adminListRooms);

  // Internal Admin: DELETE /watch-party/internal/admin/:id — force close room (admin)
  router.delete('/internal/admin/:id', requireInternalSecret, watchPartyController.adminCloseRoom);

  // Internal Admin: POST /watch-party/internal/admin/:id/join — admin join any room
  router.post('/internal/admin/:id/join', requireInternalSecret, watchPartyController.adminJoinRoom);

  // Internal Admin: POST /watch-party/internal/admin/:id/control — admin video control
  router.post('/internal/admin/:id/control', requireInternalSecret, watchPartyController.adminControlRoom);

  // Internal Admin: DELETE /watch-party/internal/admin/:id/members/:userId — kick any member
  router.delete('/internal/admin/:id/members/:userId', requireInternalSecret, watchPartyController.adminKickMember);

  // GET /watch-party/rooms — list all active rooms (sorted by member count)
  router.get('/rooms', verifyToken, notBlocked, watchPartyController.getRooms);

  // POST /watch-party/rooms — create room (max 5/min per IP)
  router.post('/rooms', verifyToken, notBlocked, createLimiter, watchPartyController.createRoom);

  // GET /watch-party/rooms/:id — get room details
  router.get('/rooms/:id', verifyToken, notBlocked, watchPartyController.getRoom);

  // POST /watch-party/rooms/join/:inviteCode — join room (max 10/min per user)
  router.post('/rooms/join/:inviteCode', verifyToken, notBlocked, joinLimiter, watchPartyController.joinRoom);

  // DELETE /watch-party/rooms/:id — close room (owner only) (T-S028)
  router.delete('/rooms/:id', verifyToken, notBlocked, watchPartyController.closeRoom);

  // DELETE /watch-party/rooms/:id/leave — leave room
  router.delete('/rooms/:id/leave', verifyToken, notBlocked, watchPartyController.leaveRoom);

  // POST /watch-party/rooms/:id/invite — send watch party invite notification to a friend
  router.post('/rooms/:id/invite', verifyToken, notBlocked, watchPartyController.inviteUser);

  // POST aliases — mobile uses POST instead of DELETE for leave, and /join without /rooms prefix
  router.post('/rooms/:id/leave', verifyToken, notBlocked, watchPartyController.leaveRoom);
  router.post('/join/:inviteCode', verifyToken, notBlocked, joinLimiter, watchPartyController.joinRoom);

  return router;
};
