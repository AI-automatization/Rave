import { Router } from 'express';
import Redis from 'ioredis';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { createDomainController } from '../controllers/domain.controller';

export const createDomainRouter = (redis: Redis): Router => {
  const router = Router();
  const ctrl = createDomainController(redis);

  // Authenticated — mobile reports a domain visit from the in-app browser
  router.post('/domains/visit', verifyToken, apiRateLimiter, ctrl.trackVisit);

  // Internal — watch-party service reports a domain visit on room creation
  router.post('/internal/domains/visit', requireInternalSecret, ctrl.trackVisit);

  // Public — mobile fetches blocked list on startup (cached 1h in Redis)
  router.get('/blocked-domains', apiRateLimiter, ctrl.getBlockedDomains);

  // Internal admin — requires X-Internal-Secret header
  router.get('/internal/admin/domains', requireInternalSecret, ctrl.listDomains);
  router.patch('/internal/admin/domains/:domain/block', requireInternalSecret, ctrl.blockDomain);
  router.patch('/internal/admin/domains/:domain/unblock', requireInternalSecret, ctrl.unblockDomain);

  return router;
};
