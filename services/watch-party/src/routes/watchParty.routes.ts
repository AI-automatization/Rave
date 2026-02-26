import { Router } from 'express';
import Redis from 'ioredis';
import { WatchPartyController } from '../controllers/watchParty.controller';
import { WatchPartyService } from '../services/watchParty.service';
import { verifyToken } from '@shared/middleware/auth.middleware';

export const createWatchPartyRouter = (redis: Redis): Router => {
  const router = Router();
  const watchPartyService = new WatchPartyService(redis);
  const watchPartyController = new WatchPartyController(watchPartyService);

  // POST /watch-party/rooms
  router.post('/rooms', verifyToken, watchPartyController.createRoom);

  // GET /watch-party/rooms/:id
  router.get('/rooms/:id', verifyToken, watchPartyController.getRoom);

  // POST /watch-party/rooms/join/:inviteCode
  router.post('/rooms/join/:inviteCode', verifyToken, watchPartyController.joinRoom);

  // DELETE /watch-party/rooms/:id/leave
  router.delete('/rooms/:id/leave', verifyToken, watchPartyController.leaveRoom);

  return router;
};
