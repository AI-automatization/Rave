import { Router } from 'express';
import Redis from 'ioredis';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { createDomainController } from '../controllers/domain.controller';

export const createDomainRouter = (redis: Redis): Router => {
  const router = Router();
  const ctrl = createDomainController(redis);

  // Public — mobile fetches blocked list on startup (cached 1h in Redis)
  router.get('/blocked-domains', apiRateLimiter, ctrl.getBlockedDomains);

  // Internal admin — requires X-Internal-Secret header
  router.get('/internal/admin/domains', requireInternalSecret, ctrl.listDomains);
  router.patch('/internal/admin/domains/:domain/block', requireInternalSecret, ctrl.blockDomain);
  router.patch('/internal/admin/domains/:domain/unblock', requireInternalSecret, ctrl.unblockDomain);

  return router;
};
