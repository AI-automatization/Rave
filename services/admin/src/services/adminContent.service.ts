import { logger } from '@shared/utils/logger';
import {
  adminListMovies,
  adminPublishMovie,
  adminUnpublishMovie,
  adminDeleteMovie,
  adminOperatorUpdateMovie,
} from '@shared/utils/serviceClient';
import {
  adminListDomains,
  adminBlockDomain,
  adminUnblockDomain,
  adminAddBlockedDomain,
} from '@shared/utils/adminServiceClient';

export class AdminContentService {
  async listMovies(filters: {
    page: number;
    limit: number;
    isPublished?: boolean;
    search?: string;
    genre?: string;
  }): Promise<{ movies: unknown[]; total: number }> {
    return adminListMovies(filters);
  }

  async publishMovie(movieId: string, adminId: string): Promise<void> {
    await adminPublishMovie(movieId);
    logger.info('Movie published by admin', { movieId, adminId });
  }

  async unpublishMovie(movieId: string, adminId: string): Promise<void> {
    await adminUnpublishMovie(movieId);
    logger.info('Movie unpublished by admin', { movieId, adminId });
  }

  async deleteMovie(movieId: string, adminId: string): Promise<void> {
    await adminDeleteMovie(movieId);
    logger.warn('Movie deleted by admin', { movieId, adminId });
  }

  async operatorUpdateMovie(movieId: string, operatorId: string, data: Record<string, unknown>): Promise<void> {
    await adminOperatorUpdateMovie(movieId, data);
    logger.info('Movie updated by operator', { movieId, operatorId });
  }

  async listDomains(filters: { page?: number; limit?: number; filter?: string; search?: string }): Promise<unknown> {
    return adminListDomains(filters);
  }

  async blockDomain(domain: string): Promise<void> {
    await adminBlockDomain(domain);
    logger.info('Domain blocked by admin', { domain });
  }

  async unblockDomain(domain: string): Promise<void> {
    await adminUnblockDomain(domain);
    logger.info('Domain unblocked by admin', { domain });
  }

  async addBlockedDomain(domain: string): Promise<{ domain: string }> {
    return adminAddBlockedDomain(domain);
  }
}
