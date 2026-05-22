import { Router } from 'express';
import { ModerationController } from '../controllers/moderation.controller';
import { ModerationService } from '../services/moderation.service';
import { BannedWordsController } from '../controllers/bannedWords.controller';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';

export const createModerationRouter = (): Router => {
  const router = Router();
  const controller = new ModerationController(new ModerationService());
  const bannedWords = new BannedWordsController();

  // Internal routes — mobile
  router.post('/internal/moderation/rooms/:roomId/report', verifyToken, controller.reportRoom);
  router.post('/internal/moderation/users/:userId/report', verifyToken, controller.reportUser);
  // Appeal does NOT require JWT — blocked users have tokens cleared on block
  router.post('/internal/moderation/appeals', controller.createAppeal);
  // Internal service-to-service: other services fetch active banned words list
  router.get('/internal/moderation/banned-words', requireInternalSecret, bannedWords.getAllActiveWords);

  // Admin routes
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin', 'moderator'));

  router.get('/moderation/counts', controller.counts);
  router.get('/moderation/reports', controller.listReports);
  router.patch('/moderation/reports/:id', controller.reviewReport);
  router.get('/moderation/reports/room/:roomId/details', controller.roomDetails);
  router.post('/moderation/reports/:id/warn', controller.warnUsers);
  router.post('/moderation/reports/:id/block-owner', controller.blockOwner);
  router.get('/moderation/user-reports', controller.listUserReports);
  router.patch('/moderation/user-reports/:id', controller.reviewUserReport);
  router.get('/moderation/appeals', controller.listAppeals);
  router.patch('/moderation/appeals/:id', controller.reviewAppeal);

  // Banned words management
  router.get('/moderation/banned-words', bannedWords.listWords);
  router.post('/moderation/banned-words', bannedWords.addWord);
  router.post('/moderation/banned-words/bulk', bannedWords.addWordsBulk);
  router.delete('/moderation/banned-words/:id', bannedWords.deleteWord);
  router.patch('/moderation/banned-words/:id/toggle', bannedWords.toggleWord);

  return router;
};
