import { Router } from 'express';
import Redis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import { WatchPartyController } from '../controllers/watchParty.controller';
import { WatchPartyService } from '../services/watchParty.service';
import { verifyToken } from '@shared/middleware/auth.middleware';

export const createWatchPartyRouter = (redis: Redis, io: SocketServer): Router => {
  const router = Router();
  const watchPartyService = new WatchPartyService(redis);
  const watchPartyController = new WatchPartyController(watchPartyService, io);

  // GET /watch-party/rooms — list all active rooms (sorted by member count)
  router.get('/rooms', verifyToken, watchPartyController.getRooms);

  // POST /watch-party/rooms — create room
  router.post('/rooms', verifyToken, watchPartyController.createRoom);

  // GET /watch-party/rooms/:id — get room details
  router.get('/rooms/:id', verifyToken, watchPartyController.getRoom);

  // POST /watch-party/rooms/join/:inviteCode — join room (body: { password? })
  router.post('/rooms/join/:inviteCode', verifyToken, watchPartyController.joinRoom);

  // DELETE /watch-party/rooms/:id — close room (owner only) (T-S028)
  router.delete('/rooms/:id', verifyToken, watchPartyController.closeRoom);

  // DELETE /watch-party/rooms/:id/leave — leave room
  router.delete('/rooms/:id/leave', verifyToken, watchPartyController.leaveRoom);

  // POST /watch-party/rooms/:id/invite — send watch party invite notification to a friend
  router.post('/rooms/:id/invite', verifyToken, watchPartyController.inviteUser);

  // POST aliases — mobile uses POST instead of DELETE for leave, and /join without /rooms prefix
  router.post('/rooms/:id/leave', verifyToken, watchPartyController.leaveRoom);
  router.post('/join/:inviteCode', verifyToken, watchPartyController.joinRoom);

  return router;
};
