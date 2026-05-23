import {
  adminListDomains,
  adminBlockDomain,
  adminUnblockDomain,
  adminAddBlockedDomain,
} from '@shared/utils/adminServiceClient';

export class AdminContentService {
  async listDomains(filters: { page?: number; limit?: number; filter?: string; search?: string }): Promise<unknown> {
    return adminListDomains(filters);
  }

  async blockDomain(domain: string): Promise<void> {
    await adminBlockDomain(domain);
  }

  async unblockDomain(domain: string): Promise<void> {
    await adminUnblockDomain(domain);
  }

  async addBlockedDomain(domain: string): Promise<{ domain: string }> {
    return adminAddBlockedDomain(domain);
  }
}
