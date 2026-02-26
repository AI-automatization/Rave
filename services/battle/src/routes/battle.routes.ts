import { Router } from 'express';
import Redis from 'ioredis';
import { BattleController } from '../controllers/battle.controller';
import { BattleService } from '../services/battle.service';
import { verifyToken } from '@shared/middleware/auth.middleware';

export const createBattleRouter = (redis: Redis): Router => {
  const router = Router();
  const battleService = new BattleService(redis);
  const battleController = new BattleController(battleService);

  // POST /battles — create
  router.post('/', verifyToken, battleController.createBattle);

  // GET /battles/me — my battles
  router.get('/me', verifyToken, battleController.getMyBattles);

  // GET /battles/:id
  router.get('/:id', verifyToken, battleController.getBattle);

  // POST /battles/:id/invite
  router.post('/:id/invite', verifyToken, battleController.inviteParticipant);

  // POST /battles/:id/accept
  router.post('/:id/accept', verifyToken, battleController.acceptInvite);

  // GET /battles/:id/leaderboard
  router.get('/:id/leaderboard', verifyToken, battleController.getLeaderboard);

  return router;
};
