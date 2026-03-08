import { Router } from 'express';
import Redis from 'ioredis';
import { WatchPartyController } from '../controllers/watchParty.controller';
import { WatchPartyService } from '../services/watchParty.service';
import { verifyToken } from '@shared/middleware/auth.middleware';

export const createWatchPartyRouter = (redis: Redis): Router => {
  const router = Router();
  const watchPartyService = new WatchPartyService(redis);
  const watchPartyController = new WatchPartyController(watchPartyService);

  // GET /watch-party/rooms — list all active rooms (sorted by member count)
  router.get('/rooms', verifyToken, watchPartyController.getRooms);

  // POST /watch-party/rooms — create room
  router.post('/rooms', verifyToken, watchPartyController.createRoom);

  // GET /watch-party/rooms/:id — get room details
  router.get('/rooms/:id', verifyToken, watchPartyController.getRoom);

  // POST /watch-party/rooms/join/:inviteCode — join room (body: { password? })
  router.post('/rooms/join/:inviteCode', verifyToken, watchPartyController.joinRoom);

  // DELETE /watch-party/rooms/:id/leave — leave room
  router.delete('/rooms/:id/leave', verifyToken, watchPartyController.leaveRoom);

  return router;
};
