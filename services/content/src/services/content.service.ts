import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { WatchProgress } from '../models/watchProgress.model';
import { logger } from '@shared/utils/logger';

export class ContentService {
  constructor(_redis: Redis, _elastic: ElasticsearchClient) {}

  async deleteUserData(userId: string): Promise<void> {
    await WatchProgress.deleteMany({ userId });
    logger.info('ContentService: deleted user data', { userId });
  }
}
