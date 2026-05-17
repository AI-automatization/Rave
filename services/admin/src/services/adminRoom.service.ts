import { logger } from '@shared/utils/logger';
import { AuditLog } from '../models/auditLog.model';
import {
  adminListBattles,
  adminEndBattle,
  adminCancelBattle,
  adminListWatchParties,
  adminCloseWatchParty,
  adminJoinWatchParty,
  adminControlWatchParty,
  adminKickWatchPartyMember,
} from '@shared/utils/serviceClient';

export class AdminRoomService {
  private async logAudit(
    adminId: string,
    adminEmail: string,
    action: string,
    details: Record<string, unknown>,
    targetId?: string,
    targetType?: string,
  ): Promise<void> {
    try {
      await AuditLog.create({ adminId, adminEmail, action, targetId, targetType, details });
    } catch (err) {
      logger.warn('Audit log write failed', { error: (err as Error).message, action, adminId });
    }
  }

  async listBattles(filters: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ battles: unknown[]; total: number }> {
    return adminListBattles(filters);
  }

  async endBattle(battleId: string, adminId: string): Promise<void> {
    await adminEndBattle(battleId);
    logger.info('Battle force-ended by admin', { battleId, adminId });
  }

  async cancelBattle(battleId: string, adminId: string): Promise<void> {
    await adminCancelBattle(battleId);
    logger.info('Battle cancelled by admin', { battleId, adminId });
  }

  async listWatchParties(filters: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ rooms: unknown[]; total: number }> {
    return adminListWatchParties(filters);
  }

  async closeWatchParty(roomId: string, adminId: string, adminEmail: string, closeReason?: string): Promise<void> {
    await adminCloseWatchParty(roomId, adminEmail, closeReason);
    logger.info('WatchParty force-closed by admin', { roomId, adminId, closeReason });
    await this.logAudit(adminId, adminEmail, 'close_watchparty', { closeReason }, roomId, 'watchparty');
  }

  async joinWatchParty(roomId: string, adminId: string): Promise<{ room: unknown }> {
    const result = await adminJoinWatchParty(roomId);
    logger.info('Admin joined WatchParty', { roomId, adminId });
    return result;
  }

  async controlWatchParty(
    roomId: string,
    action: 'play' | 'pause' | 'seek',
    currentTime: number | undefined,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    await adminControlWatchParty(roomId, action, currentTime);
    logger.info('Admin controlled WatchParty', { roomId, action, adminId });
    await this.logAudit(adminId, adminEmail, 'control_watchparty', { action, currentTime }, roomId, 'watchparty');
  }

  async kickWatchPartyMember(roomId: string, userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminKickWatchPartyMember(roomId, userId);
    logger.info('Admin kicked WatchParty member', { roomId, userId, adminId });
    await this.logAudit(adminId, adminEmail, 'kick_member', { userId }, roomId, 'watchparty');
  }
}
