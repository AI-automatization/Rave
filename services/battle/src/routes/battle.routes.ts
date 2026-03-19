import { Router } from 'express';
import Redis from 'ioredis';
import { BattleController } from '../controllers/battle.controller';
import { BattleService } from '../services/battle.service';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';

export const createBattleRouter = (redis: Redis): Router => {
  const router = Router();
  const battleService = new BattleService(redis);
  const battleController = new BattleController(battleService);

  // POST /battles — create
  router.post('/', verifyToken, battleController.createBattle);

  // GET /battles/me — my battles
  router.get('/me', verifyToken, battleController.getMyBattles);

  // Internal: GET /battles/internal/user-stats/:userId — for user service aggregation
  router.get('/internal/user-stats/:userId', requireInternalSecret, battleController.getUserStats);

  // Internal Admin: GET /battles/internal/admin/list — list all battles (admin)
  router.get('/internal/admin/list', requireInternalSecret, battleController.adminListBattles);

  // Internal Admin: POST /battles/internal/admin/:id/end — force end battle (admin)
  router.post('/internal/admin/:id/end', requireInternalSecret, battleController.adminEndBattle);

  // GET /battles/:id
  router.get('/:id', verifyToken, battleController.getBattle);

  // POST /battles/:id/invite
  router.post('/:id/invite', verifyToken, battleController.inviteParticipant);

  // POST /battles/:id/accept
  router.post('/:id/accept', verifyToken, battleController.acceptInvite);

  // POST /battles/:id/reject (T-S029)
  router.post('/:id/reject', verifyToken, battleController.rejectInvite);

  // GET /battles/:id/leaderboard
  router.get('/:id/leaderboard', verifyToken, battleController.getLeaderboard);

  // PUT aliases — mobile uses PUT instead of POST for accept/reject
  router.put('/:id/accept', verifyToken, battleController.acceptInvite);
  router.put('/:id/reject', verifyToken, battleController.rejectInvite);

  return router;
};
